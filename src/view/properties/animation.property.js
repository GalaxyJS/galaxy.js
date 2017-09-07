/* global Galaxy, TweenLite, TimelineLite */
'use strict';

(function (G) {
  G.GalaxyView.NODE_SCHEMA_PROPERTY_MAP['animation'] = {
    type: 'custom',
    name: 'animation',
    /**
     *
     * @param {Galaxy.GalaxyView.ViewNode} viewNode
     * @param attr
     * @param config
     * @param scopeData
     */
    handler: function (viewNode, attr, config, oldConfig, scopeData) {
      viewNode.rendered.then(function () {
        if (viewNode.virtual || !config) {
          return;
        }

        let enterAnimationConfig = config[':enter'];
        if (enterAnimationConfig) {
          viewNode.sequences[':enter'].next(function (done) {
            if (enterAnimationConfig.sequence) {
              let animationMeta = AnimationMeta.get(enterAnimationConfig.sequence);
              animationMeta.s = enterAnimationConfig.sequence;
              animationMeta.duration = enterAnimationConfig.duration;
              animationMeta.position = enterAnimationConfig.position;
              
              if (enterAnimationConfig.parent) {
                animationMeta.setParent(AnimationMeta.get(enterAnimationConfig.parent));
              }

              let lastStep = enterAnimationConfig.to || enterAnimationConfig.from;
              lastStep.clearProps = 'all';
              animationMeta.add(viewNode.node, enterAnimationConfig, done);
            } else {
              AnimationMeta.createTween(viewNode.node, enterAnimationConfig, done);
            }
          });
        }

        let leaveAnimationConfig = config[':leave'];
        if (leaveAnimationConfig) {
          viewNode.sequences[':destroy'].next(function (done) {
            viewNode._destroyed = true;
            done();
          });

          viewNode.sequences[':leave'].next(function (done) {
            if (leaveAnimationConfig.sequence) {
              let animationMeta = AnimationMeta.get(leaveAnimationConfig.sequence);
              animationMeta.duration = leaveAnimationConfig.duration;
              animationMeta.position = leaveAnimationConfig.position;
              // if the animation has order it will be added to the queue according to its order.
              // No order means lowest order
              if (typeof leaveAnimationConfig.order === 'number') {
                animationMeta.addToQueue(leaveAnimationConfig.order, viewNode.node, (function (viewNode, am, conf) {
                  return function () {
                    if (conf.parent) {
                      const parent = AnimationMeta.get(conf.parent);
                      am.setParent(parent, 'leave');
                      // Update parent childrenOffset so the parent animation starts after the subTimeline animations
                      parent.childrenOffset = am.childrenOffset;
                    }

                    am.add(viewNode.node, conf, done);
                  };
                })(viewNode, animationMeta, leaveAnimationConfig));

                // When viewNode is the one which is destroyed, then run the queue
                // The queue will never run if the destroyed viewNode has the lowest order
                if (viewNode._destroyed) {
                  let finishImmediately = false;
                  while (animationMeta.parent) {
                    animationMeta = animationMeta.parent;
                  }
                  let queue = animationMeta.queue;

                  for (let key in queue) {
                    let item;
                    for (let i = 0, len = queue[key].length; i < len; i++) {
                      item = queue[key][i];
                      item.operation();

                      // If the the current queue item.node is the destroyed node, then all the animations in
                      // queue should be ignored
                      if (item.node === viewNode.node) {
                        finishImmediately = true;
                        break;
                      }
                    }

                    if (finishImmediately) break;
                  }

                  animationMeta.queue = {};
                  delete viewNode._destroyed;
                }

                return;
              }

              if (leaveAnimationConfig.group) {
                animationMeta = animationMeta.getGroup(leaveAnimationConfig.group);
              }

              animationMeta.add(viewNode.node, leaveAnimationConfig, done);
            } else {
              AnimationMeta.createTween(viewNode.node, leaveAnimationConfig, done);
            }
          });
        }

        viewNode.observer.on('class', function (value, oldValue) {
          value.forEach(function (item) {
            if (item && oldValue.indexOf(item) === -1) {
              let _config = config['.' + item];
              if (_config) {
                viewNode.sequences[':class'].next(function (done) {

                  let classAnimationConfig = _config;
                  classAnimationConfig.to = Object.assign({className: '+=' + item || ''}, _config.to || {});

                  if (classAnimationConfig.sequence) {
                    let animationMeta = AnimationMeta.get(classAnimationConfig.sequence);

                    if (classAnimationConfig.group) {
                      animationMeta = animationMeta.getGroup(classAnimationConfig.group, classAnimationConfig.duration, classAnimationConfig.position || '+=0');
                    }

                    animationMeta.add(viewNode.node, classAnimationConfig, done);
                  } else {
                    AnimationMeta.createTween(viewNode.node, classAnimationConfig, done);
                  }
                });
              }
            }
          });

          oldValue.forEach(function (item) {
            if (item && value.indexOf(item) === -1) {
              let _config = config['.' + item];
              if (_config) {
                viewNode.sequences[':class'].next(function (done) {
                  let classAnimationConfig = _config;
                  classAnimationConfig.to = {className: '-=' + item || ''};

                  if (classAnimationConfig.sequence) {
                    let animationMeta = AnimationMeta.get(classAnimationConfig.sequence);

                    if (classAnimationConfig.group) {
                      animationMeta = animationMeta.getGroup(classAnimationConfig.group);
                    }

                    animationMeta.add(viewNode.node, classAnimationConfig, done);
                  } else {
                    AnimationMeta.createTween(viewNode.node, classAnimationConfig, done);
                  }
                });
              }
            }
          });
        });
      });
    }
  };

  function AnimationMeta(onComplete) {
    this.timeline = new TimelineLite({
      autoRemoveChildren: true,
      onComplete: onComplete
    });

    this.timeline.addLabel('beginning', 0);
    this.duration = 0;
    this.position = '+=0';
    this.subSequences = {};
    this.queue = {};
    // this.commands = new Galaxy.GalaxySequence();
    // this.commands.start();
    this.childrenOffset = 0;
    this.subTimelineOffset = 0;
    this.offset = 0;
    this.parent = null;
  }

  AnimationMeta.ANIMATIONS = {};

  AnimationMeta.get = function (name) {
    if (!AnimationMeta.ANIMATIONS[name]) {
      AnimationMeta.ANIMATIONS[name] = new AnimationMeta();
    }

    return AnimationMeta.ANIMATIONS[name];
  };

  AnimationMeta.parseSequence = function (sequence) {
    return sequence.split('/').filter(Boolean);
  };

  AnimationMeta.createTween = function (node, config, onComplete) {
    let to = Object.assign({}, config.to || {});
    to.onComplete = onComplete;
    let tween = null;

    if (config.from && config.to) {
      tween = TweenLite.fromTo(node,
        config.duration || 0,
        config.from || {},
        to);
    } else if (config.from) {
      let from = Object.assign({}, config.from || {});
      from.onComplete = onComplete;
      tween = TweenLite.from(node,
        config.duration || 0,
        from || {});
    } else {
      tween = TweenLite.to(node,
        config.duration || 0,
        to || {});
    }

    return tween;
  };

  AnimationMeta.calculateDuration = function (duration, position) {
    let po = position.replace('=', '');
    return ((duration * 10) + (Number(po) * 10)) / 10;
  };

  AnimationMeta.prototype.setParent = function (parent, type) {
    let _this = this;
    _this.parent = parent;
    const children = _this.parent.timeline.getChildren();

    if (children.indexOf(_this.timeline) === -1) {
      let subTimelineOffset = AnimationMeta.calculateDuration(_this.parent.duration, _this.parent.position || '+=0');

      if (type === 'leave') {
        // subTimeline should start immediately when state is leave
        if (_this.parent.timeline.progress() === undefined) {
          _this.parent.subTimelineOffset = 0;
        }

        _this.parent.timeline.add(this.timeline, _this.parent.subTimelineOffset);
        _this.parent.timeline.add(function () {
          _this.parent.subTimelineOffset = ((_this.parent.subTimelineOffset * 10) - (subTimelineOffset * 10)) / 10;
        });

        _this.parent.subTimelineOffset = ((_this.parent.subTimelineOffset * 10) + (subTimelineOffset * 10)) / 10;
      } else {
        if (_this.parent.timeline.progress() === undefined) {
          return;
        }

        // There should be a starting offset when state is enter
        if (_this.parent.subTimelineOffset === 0) {
          _this.parent.subTimelineOffset = subTimelineOffset;
        }

        _this.parent.subTimelineOffset = ((_this.parent.subTimelineOffset * 10) + (subTimelineOffset * 10)) / 10;

        _this.parent.timeline.add(this.timeline, _this.parent.subTimelineOffset);
        _this.parent.timeline.add(function () {
          _this.parent.subTimelineOffset = ((_this.parent.subTimelineOffset * 10) - (subTimelineOffset * 10)) / 10;
        });
      }
    }
  };

  AnimationMeta.prototype.add = function (node, config, onComplete) {
    const _this = this;
    let to = Object.assign({}, config.to || {});
    to.onComplete = onComplete;

    let tween = null;
    if (config.from && config.to) {
      tween = TweenLite.fromTo(node,
        config.duration || 0,
        config.from || {},
        to);
    } else if (config.from) {
      let from = Object.assign({}, config.from || {});
      from.onComplete = onComplete;
      tween = TweenLite.from(node,
        config.duration || 0,
        from || {});
    } else {
      tween = TweenLite.to(node,
        config.duration || 0,
        to || {});
    }

    let cal = AnimationMeta.calculateDuration(config.duration, config.position || '+=0');
    if (this.timeline.getChildren().length === 0) {
      cal = 0;
    }

    _this.childrenOffset = ((_this.childrenOffset * 10) + (cal * 10)) / 10;
    _this.timeline.add(tween, _this.childrenOffset);
    _this.timeline.add(function () {
      _this.childrenOffset = ((_this.childrenOffset * 10) - (cal * 10)) / 10;
    });
  };

  /**
   *
   * @param {number} order
   * @param {callback} operation
   */
  AnimationMeta.prototype.addToQueue = function (order, node, operation) {
    if (this.parent) {
      return this.parent.addToQueue(order, node, operation);
    }

    if (!this.queue[order]) {
      this.queue[order] = [];
    }

    this.queue[order].push({node: node, operation: operation});
  };
})(Galaxy);

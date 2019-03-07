import React, { Component, Children, isValidElement, createElement } from 'react';
import PropTypes from 'prop-types';
import classlist from 'classlist';
import _ from 'lodash';
import { isInViewport } from './lib';

const CALLBACK_NOOP = () => {};
const DEFAULT_OFFSET_VERTICAL = -200;
const MONITORED_CLS_NAME = 'in-view-monitored';
const IN_VIEW_CLS_NAME = 'is-visible';

class InViewMonitor extends Component {
  static propTypes = {
    // 容器或容器子项的标签名，默认div，当然可指定table、ul等任何符合语义化的标签
    as: PropTypes.string,
    // 容器的标签名，默认div，当然可指定table、ul等任何符合语义化的标签
    containerAs: PropTypes.string,
    // 容器子项的标签名，默认div，当然可指定tr、li等任何符合语义化的标签
    itemAs: PropTypes.string,
    // 用来判断组件是否处于当前视图的垂直方向偏移量，参数含义参考isInViewport方法的offset参数
    offsetVertical: PropTypes.number,
    // 表示是否禁用本组件功能
    disabled: PropTypes.bool,
    // 表示是否一次性应用动画效果
    flush: PropTypes.bool,
    // 滚动事件监听器的去抖动值
    debounce: PropTypes.number,
    // 滚动事件监听器的去抖动选项，参考lodash的debounce方法传参
    debounceOptions: PropTypes.object,
    // 容器的其他组件属性
    containerProps: PropTypes.object,
    // 容器子项的其他组件属性，可以是对象或函数
    itemProps: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    // 容器的类名
    containerClsName: PropTypes.string,
    // 容器子项的类名
    monitoredClsName: PropTypes.string,
    // 容器子项进入视图时的类名，通常这里添加动画效果，可以是字符串或者数组
    inViewClsName: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    // 容器子项待进入视图时的类名，可以是字符串或者数组
    outViewClsName: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    // 容器禁用时容器子项的类名，可以是字符串或者数组
    disabledViewClsName: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    // 容器子项待进入视图时指定child的内容（可选）
    outViewChild: PropTypes.element,
    // 用来判断组件是否处于当前视图的选项，参数含义参考isInViewport方法
    inViewOptions: PropTypes.object,
    // TODO: implement
    // 容器进入视图的回调方法
    onEnterView: PropTypes.func,
    // TODO: implement
    // 容器离开视图的回调方法
    onLeaveView: PropTypes.func,
  };

  static defaultProps = {
    as: 'div',
    disabled: false,
    flush: false,
    debounce: 300,
    debounceOptions: {
      maxWait: 1000,
    },
    containerProps: {},
    itemProps: {}, // or (child, index) => {}
    monitoredClsName: MONITORED_CLS_NAME,
    inViewClsName: IN_VIEW_CLS_NAME,
    inViewOptions: {},
    onEnterView: CALLBACK_NOOP,
    onLeaveView: CALLBACK_NOOP,
  };

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
    };
    this._mounted = false;
    this.container = null;
    this.items = [];
    this.setContainerRef = this.setContainerRef.bind(this);
    this.collectItemRef = this.collectItemRef.bind(this);
    this.scrollHandlerDebounced =
      props.debounce > 0
        ? _.debounce(this.scrollHandler, props.debounce, props.debounceOptions).bind(this)
        : this.scrollHandler.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.disabled !== this.props.disabled || nextState.visible;
  }

  componentDidMount() {
    this._mounted = true;
    this.checkContainerInView();
    this.bindScrollListener();
  }

  componentDidUpdate() {
    this.applyChildrenInView();
  }

  componentWillUnmount() {
    this._mounted = false;
    this.unbindScrollListener();
  }

  setContainerRef(node) {
    this.container = node;
  }

  collectItemRef(node) {
    this.items.push(node);
  }

  bindScrollListener() {
    let { disabled } = this.props;
    if (!disabled) {
      window.addEventListener('scroll', this.scrollHandlerDebounced);
    }
  }

  unbindScrollListener() {
    let { disabled } = this.props;
    if (!disabled) {
      window.removeEventListener('scroll', this.scrollHandlerDebounced);
    }
  }

  scrollHandler() {
    let { disabled } = this.props;
    if (!disabled) {
      this.checkContainerInView();
    }
  }

  checkContainerInView() {
    let { disabled } = this.props;
    if (!disabled && this._mounted && this.container && isInViewport(this.container, this.getInViewOptions())) {
      this.setState({
        ...this.state,
        visible: true,
      });
      return true;
    }
    return false;
  }

  applyChildrenInView() {
    let { flush, disabled } = this.props;
    if (!disabled) {
      let lastInViewIndex = _.findLastIndex(this.items, item => item && isInViewport(item, this.getInViewOptions()));
      _.forEach(this.items, (child, index) => {
        if (flush) {
          child && classlist(child).add(...this.getInViewClsName());
        } else {
          if (index <= lastInViewIndex) {
            // TODO: call onEnterView
            child && classlist(child).add(...this.getInViewClsName());
          }
        }
      });
    }
  }

  getContainerAs() {
    let { as, containerAs } = this.props;
    return containerAs || as || 'div';
  }

  getItemAs() {
    let { as, itemAs } = this.props;
    return itemAs || as || 'div';
  }

  getInViewClsName() {
    let { inViewClsName } = this.props;
    return this.getViewClsNameAsArray(inViewClsName);
  }

  getOutViewClsName() {
    let { inViewClsName, outViewClsName } = this.props;
    return this.getViewClsNameAsArray(outViewClsName == undefined ? inViewClsName : outViewClsName);
  }

  getDisabledViewClsName() {
    let { inViewClsName, disabledViewClsName } = this.props;
    return this.getViewClsNameAsArray(disabledViewClsName == undefined ? inViewClsName : disabledViewClsName);
  }

  getViewClsNameAsArray(clsName) {
    return typeof clsName === 'string' ? [clsName] : _.isArray(clsName) ? clsName : [];
  }

  getInViewOptions() {
    let { offsetVertical, inViewOptions } = this.props;
    if (_.isEmpty(inViewOptions)) {
      return {
        tolerance: {
          top: offsetVertical == undefined ? DEFAULT_OFFSET_VERTICAL : +offsetVertical,
        },
        offset: {
          top: offsetVertical == undefined ? DEFAULT_OFFSET_VERTICAL : +offsetVertical,
        },
      };
    }
    return inViewOptions;
  }

  getItemPropsByChild(child, index) {
    let { itemProps } = this.props;
    if (itemProps) {
      if (typeof itemProps === 'object') {
        return itemProps;
      } else if (typeof itemProps === 'function') {
        return itemProps(child, index);
      }
    }
    return null;
  }

  render() {
    const { disabled, flush, containerProps, containerClsName, monitoredClsName, outViewChild, children } = this.props;
    const { visible } = this.state;

    return createElement(
      this.getContainerAs(),
      {
        ...containerProps,
        className: containerClsName,
        ref: this.setContainerRef,
      },
      Children.map(children, (child, index) => {
        if (!isValidElement(child)) {
          return child;
        }

        const { inViewMonitored = true, onEnterView } = child.props;
        if (inViewMonitored) {
          if (disabled) {
            return createElement(
              this.getItemAs(),
              {
                ...this.getItemPropsByChild(child, index),
                className: monitoredClsName + ' ' + this.getDisabledViewClsName().join(' '),
                ref: this.collectItemRef,
              },
              child,
            );
          } else {
            if (visible) {
              if (flush) {
                onEnterView && onEnterView();
              }
              return createElement(
                this.getItemAs(),
                {
                  ...this.getItemPropsByChild(child, index),
                  className: monitoredClsName,
                  ref: this.collectItemRef,
                },
                child,
              );
            } else if (outViewChild) {
              return createElement(
                this.getItemAs(),
                {
                  ...this.getItemPropsByChild(child, index),
                  className: monitoredClsName + ' ' + this.getOutViewClsName().join(' '),
                  ref: this.collectItemRef,
                },
                outViewChild,
              );
            }
            return null;
          }
        }
        return child;
      }),
    );
  }
}

export default InViewMonitor;

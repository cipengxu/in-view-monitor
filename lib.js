/**
 * 判断元素是否在框定的视窗内，视窗默认是window对象（支持客户端调用、依赖getBoundingClientRect支持）
 * @author cpxu@Ctrip.com
 * @param element         {Element}               要判断的元素
 * @param type            {string}                取值='PARTIAL' | 'FULL'，默认PARTIAL
 *                                                  1.PARTIAL: 部分时，只要元素有一部分在视窗内即返回true
 *                                                  2.FULL:    全部时，只有元素完全在视窗内时才返回true
 * @param tolerance       {number|string|object}  视窗允许进行忽略上下左右边距的方式判断元素是否在视窗内，向内允许：参数为正，向外允许：参数为负
 * @param offset          {number|string|object}  视窗允许进行上下左右边距偏移的方式判断元素是否在视窗内，向上或向右平移：参数为正，向下或向左平移：参数为负
 * @param ignoreHidden    {boolean}               是否忽略隐藏元素，默认false
 *                                                  1.true表示隐藏元素不进行判断，直接返回false
 *                                                  2.false表示隐藏元素也考虑进行判断
 * @param viewport        {Element}               参考的视窗对象
 * @returns {boolean}
 */
export const isInViewport = (element, { type, tolerance = 0, offset = 0, ignoreHidden = false, viewport } = {}) => {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document) {
    if (!element || (ignoreHidden && isHidden(element))) {
      return false;
    }

    if (typeof Element.prototype.getBoundingClientRect !== 'undefined') {
      let { top, bottom, left, right, width, height } = element.getBoundingClientRect();
      let viewportWidth = viewport ? viewport.clientWidth : window.innerWidth || document.documentElement.clientWidth;
      let viewportHeight = viewport
        ? viewport.clientHeight
        : window.innerHeight || document.documentElement.clientHeight;

      type = (type || 'PARTIAL').toUpperCase();

      let toleranceBox = normalizeBoxArgs(tolerance);
      let offsetBox = normalizeBoxArgs(offset);
      let { top: toleranceTop, bottom: toleranceBottom, left: toleranceLeft, right: toleranceRight } = toleranceBox;
      let { vertical: offsetVertical, horizontal: offsetHorizontal } = aggregateBoxArgs(offsetBox);

      if (type === 'PARTIAL') {
        let { vertical: toleranceVertical, horizontal: toleranceHorizontal } = aggregateBoxArgs(toleranceBox);
        let verticalInView =
          top + offsetVertical <= viewportHeight && top + height + offsetVertical >= toleranceVertical;
        let horizontalInView =
          left + offsetHorizontal <= viewportWidth && left + width + offsetHorizontal >= toleranceHorizontal;
        return verticalInView && horizontalInView;
      } else if (type === 'FULL') {
        return (
          top + offsetVertical >= toleranceTop &&
          left - offsetHorizontal + right >= viewportWidth + toleranceLeft &&
          bottom + offsetVertical + toleranceBottom <= viewportHeight &&
          right + offsetHorizontal + toleranceRight <= viewportWidth
        );
      }
    }
    return false;
  } else {
    throw new Error('isInViewport can only be called in browser environment.');
  }
};

const normalizeBoxArgs = box => {
  let boxTop = 0;
  let boxBottom = 0;
  let boxLeft = 0;
  let boxRight = 0;

  if (typeof box === 'number' || typeof box === 'string') {
    boxTop = box;
    boxBottom = box;
    boxLeft = box;
    boxRight = box;
  } else {
    let { top: _top = 0, bottom: _bottom = 0, left: _left = 0, right: _right = 0 } = box || {};
    boxTop = _top;
    boxBottom = _bottom;
    boxLeft = _left;
    boxRight = _right;
  }

  boxTop = ~~Math.round(parseFloat(boxTop));
  boxBottom = ~~Math.round(parseFloat(boxBottom));
  boxLeft = ~~Math.round(parseFloat(boxLeft));
  boxRight = ~~Math.round(parseFloat(boxRight));

  return {
    top: boxTop,
    bottom: boxBottom,
    left: boxLeft,
    right: boxRight,
  };
};

const aggregateBoxArgs = ({ top = 0, bottom = 0, left = 0, right = 0 } = {}) => {
  let vertical = top !== 0 ? top : bottom !== 0 ? bottom : 0;
  let horizontal = left !== 0 ? left : right !== 0 ? right : 0;
  return {
    vertical,
    horizontal,
  };
};

// 简单版本的获取指定样式属性值的方法
const getStyle = (elem, prop) => {
  if (typeof window !== 'undefined' && elem) {
    return typeof window.getComputedStyle !== 'undefined'
      ? window.getComputedStyle(elem, null).getPropertyValue(prop)
      : elem.style[prop];
  }
  return null;
};

// 判断元素是否隐藏
const isHidden = (element, { careDisplay = true, careVisibility = false, careOpacity = false } = {}) => {
  if (element) {
    let styleDisplay = getStyle(element, 'display');
    let styleVisibility = getStyle(element, 'visibility');
    let styleOpacity = getStyle(element, 'opacity');
    let isDisplayNone = styleDisplay && styleDisplay === 'none';
    let isVisibilityHidden = styleVisibility && styleVisibility === 'hidden';
    let isOpacityZero = styleOpacity && styleOpacity === '0';
    return (
      !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length) ||
      (careDisplay && isDisplayNone) ||
      (careVisibility && isVisibilityHidden) ||
      (careOpacity && isOpacityZero)
    );
  }
  return false;
};

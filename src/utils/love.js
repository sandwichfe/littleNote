// src/utils/love.js
export function useLoveEffect() {
  let hearts = [];
  let animationFrameId = null;

  const requestAnimationFrame = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      return setTimeout(callback, 1000 / 60);
    };

  const cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout;

  function gameloop() {
    for (let i = 0; i < hearts.length; i++) {
      if (hearts[i].alpha <= 0) {
        document.body.removeChild(hearts[i].el);
        hearts.splice(i, 1);
        continue;
      }
      hearts[i].y--;
      hearts[i].scale += 0.004;
      hearts[i].alpha -= 0.013;
      hearts[i].el.style.cssText = `left:${hearts[i].x}px;top:${hearts[i].y}px;opacity:${hearts[i].alpha};transform:scale(${hearts[i].scale},${hearts[i].scale}) rotate(45deg);background:${hearts[i].color}`;
    }
    animationFrameId = requestAnimationFrame(gameloop);
  }

  function createHeart(event) {
    const d = document.createElement('div');
    d.className = 'heart';
    hearts.push({
      el: d,
      x: event.clientX - 5,
      y: event.clientY - 5,
      scale: 1,
      alpha: 1,
      color: randomColor(),
    });
    document.body.appendChild(d);
  }

  function css(cssText) {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'love-effect-style'; // Add an ID for easy removal
    try {
      style.appendChild(document.createTextNode(cssText));
    } catch (ex) {
      style.styleSheet.cssText = cssText;
    }
    document.head.appendChild(style);
  }

  function randomColor() {
    return `rgba(${~~(Math.random() * 255)},${~~(Math.random() * 255)},${~~(Math.random() * 255)},1)`;
  }

  const clickHandler = (event) => {
    createHeart(event);
  };

  function start() {
    stop(); // Ensure no multiple instances are running
    css(".heart{width: 10px;height: 10px;position: fixed;background: #f00;transform: rotate(45deg);-webkit-transform: rotate(45deg);-moz-transform: rotate(45deg);}.heart:after,.heart:before{content: '';width: inherit;height: inherit;background: inherit;border-radius: 50%;-webkit-border-radius: 50%;-moz-border-radius: 50%;position: absolute;}.heart:after{top: -5px;}.heart:before{left: -5px;}");
    window.addEventListener('click', clickHandler);
    gameloop();
  }

  function stop() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    window.removeEventListener('click', clickHandler);
    const styleElement = document.getElementById('love-effect-style');
    if (styleElement) {
      document.head.removeChild(styleElement);
    }
    // Clear remaining hearts from DOM and array
    hearts.forEach(h => document.body.contains(h.el) && document.body.removeChild(h.el));
    hearts = [];
  }

  return { start, stop };
}
  
  
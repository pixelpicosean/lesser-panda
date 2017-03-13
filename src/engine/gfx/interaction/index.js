/**
 * @author      Mat Groves <mat@goodboydigital.com>
 * @copyright   2013-2015 GoodBoyDigital
 * @license     {@link https://github.com/pixijs/pixi.js/blob/master/LICENSE|MIT License}
 */

// Mix interactiveTarget into Node.prototype
import Node from '../core/Node';
import interactiveTarget from './interactiveTarget';
Object.assign(Node.prototype, interactiveTarget);

// Register as renderer plugin
import InteractionManager from './InteractionManager';
import WebGLRenderer from '../core/renderers/webgl/WebGLRenderer';
import CanvasRenderer from '../core/renderers/canvas/CanvasRenderer';
WebGLRenderer.registerPlugin('interaction', InteractionManager);
CanvasRenderer.registerPlugin('interaction', InteractionManager);

import InteractionData from './InteractionData';

export {
  InteractionData,
  InteractionManager,
  interactiveTarget,
};

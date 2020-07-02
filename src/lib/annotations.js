
import {getBoolSetting} from "./helpers";

export class Annotation {
  constructor(point) {
    this.points = [point];
    this.path = new Path2D();
    this.path.moveTo(point.x, point.y);
    this.path.lineTo(point.x, point.y);
    this.strokeStyle = '#c0392b';
    this.lineWidth = 5;
    this.lineCap = 'round';
    this.lineJoin = 'round';
    this.smooth = getBoolSetting("smoothLines", true);
  }

  lineTo(point) {
    this.points.push(point);
    this.path.lineTo(point.x, point.y);
  }

  end(point) {
    this.points.push(point);
    if (this.smooth && this.points.length > 2) {
      this.path = createSmoothPath(this.points);
    } else {
      this.path.lineTo(point.x, point.y);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = this.strokeStyle;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = this.lineCap;
    ctx.lineJoin = this.lineJoin;
    ctx.shadowBlur = 1;
    ctx.shadowColor = this.strokeStyle;
    ctx.stroke(this.path);
    ctx.restore();
  }

  hitTest(point, radius) {
    var r2 = radius * radius;
    for (const pt of this.points) {
      var dist = (pt.x - point.x)**2 + (pt.y - point.y)**2;
      if (dist <= r2) {
        return true;
      }
    }
    return false;
  }
}

  
export class PageAnnotations {
  constructor() {
    this.annotations = [];
    this.redoStack = [];
  }

  clear() {
    this.annotations = [];
    this.redoStack = [];
  }

  start(point) {
    this.redoStack = [];
    var annotation = new Annotation(point);
    this.annotations.push(annotation);
    return annotation;
  }

  update(point) {
    this.top().lineTo(point);
  }

  end(point) {
    this.top().end(point);
  }

  undo() {
    var items = this.annotations.splice(this.annotations.length - 1, 1);
    if (items.length > 0) {
      this.redoStack.push(items[0]);
      return true;
    }
    return false;
  }

  redo() {
    var items = this.redoStack.splice(this.redoStack.length - 1, 1);
    if (items.length > 0) {
      this.annotations.push(items[0]);
      return true;
    }
    return false;
  }

  erase(point, radius) {
    this.annotations = this.annotations.filter(item => !item.hitTest(point, radius));
  }

  draw(ctx) {
    this.annotations.forEach(item => {
      item.draw(ctx);
    });
  }

  top() {
    return this.annotations[this.annotations.length - 1];
  }
}


function createSmoothPath(points) {
  const path = new Path2D();
  var i = 0;

  path.moveTo(points[i].x, points[i].y);
  path.lineTo(points[i].x, points[i].y);
  
  for (i = 1; i < points.length - 2; i++) {
    var xc = (points[i].x + points[i+1].x) / 2;
    var yc = (points[i].y + points[i+1].y) / 2;
    path.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  path.quadraticCurveTo(points[i].x, points[i].y, points[i+1].x, points[i+1].y);

  return path;
}
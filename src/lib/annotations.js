
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
    }
  
    lineTo(point) {
      this.points.push(point);
      this.path.lineTo(point.x, point.y);
    }
  
    end(point) {
      this.points.push(point);
      this.path.lineTo(point.x, point.y);
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

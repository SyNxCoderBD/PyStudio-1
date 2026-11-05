export const BROWSER_TURTLE_BOOTSTRAP = String.raw`
import base64 as _turtle_base64
import html as _turtle_html
import json as _turtle_json
import math as _turtle_math
import re as _turtle_re
import sys as _turtle_sys
import types as _turtle_types


def _turtle_color(value):
    color = str(value).strip()
    if _turtle_re.fullmatch(r"#[0-9a-fA-F]{3,8}|[a-zA-Z]{1,24}|rgba?\([0-9.,%\s]+\)", color):
        return color
    return "black"


class _BrowserTurtleScreen:
    def __init__(self):
        self.width = 600
        self.height = 400
        self.background = "white"
        self.items = []
        self.fills = []
        self.turtles = []
        self.dirty = True

    def _point(self, x, y):
        return self.width / 2 + float(x), self.height / 2 - float(y)

    def _append(self, owner, element, filled=False, animated=False):
        if len(self.items) + len(self.fills) >= 20000:
            raise RuntimeError("Turtle drawing limit reached (20,000 shapes).")
        (self.fills if filled else self.items).append((owner, element, animated))
        self.dirty = True

    def bgcolor(self, *colors):
        if colors:
            self.background = _turtle_color(colors[0])
            self.dirty = True
        return self.background

    def screensize(self, canvwidth=None, canvheight=None, bg=None):
        if canvwidth is not None:
            self.width = max(100, min(1600, int(canvwidth)))
        if canvheight is not None:
            self.height = max(100, min(1200, int(canvheight)))
        if bg is not None:
            self.bgcolor(bg)
        self.dirty = True
        return self.width, self.height

    def setup(self, width=None, height=None, startx=None, starty=None):
        self.screensize(width, height)

    def title(self, value):
        return str(value)

    def tracer(self, *args, **kwargs):
        return None

    def update(self):
        return None

    def clear(self):
        self.items.clear()
        self.fills.clear()
        self.dirty = True

    def reset(self):
        self.clear()
        self.background = "white"
        for turtle in self.turtles:
            turtle._reset_state()

    def bye(self):
        _flush_browser_turtle()

    def exitonclick(self):
        _flush_browser_turtle()

    def mainloop(self):
        _flush_browser_turtle()

    def _svg(self, animated=False):
        width = int(self.width)
        height = int(self.height)
        animated_count = sum(1 for _, _, should_animate in self.fills + self.items if should_animate)
        step_duration = 0.9 / max(1, animated_count)
        animation_index = 0
        parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
            f'<rect width="100%" height="100%" fill="{_turtle_color(self.background)}"/>'
        ]
        for collection in (self.fills, self.items):
            for _, item, should_animate in collection:
                if animated and should_animate:
                    tag = item[1:item.find(" ")]
                    begin = animation_index * step_duration
                    if tag == "line":
                        item = item[:-2] + f' pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" begin="{begin:.4f}s" dur="{step_duration:.4f}s" fill="freeze"/></line>'
                    else:
                        item = item[:-2] + f'><animate attributeName="opacity" from="0" to="1" begin="{begin:.4f}s" dur="{step_duration:.4f}s" fill="freeze"/></{tag}>'
                    animation_index += 1
                parts.append(item)
        if animated:
            for turtle in self.turtles:
                if len(turtle._path) < 2:
                    continue
                path = " ".join(
                    ("M" if index == 0 else "L") + f"{self._point(x, y)[0]:.2f},{self._point(x, y)[1]:.2f}"
                    for index, (x, y) in enumerate(turtle._path)
                )
                start_x, start_y = self._point(*turtle._path[0])
                parts.append(
                    f'<polygon points="11,0 -7,-5 -7,5" transform="translate({start_x:.2f} {start_y:.2f})" fill="{_turtle_color(turtle.pen_color)}"><animateMotion dur="0.9s" path="{path}" rotate="auto" fill="freeze"/></polygon>'
                )
        parts.append("</svg>")
        return "".join(parts)

    def _emit(self):
        if not self.dirty:
            return
        encoded = _turtle_base64.b64encode(self._svg().encode("utf-8")).decode("ascii")
        animation = _turtle_base64.b64encode(self._svg(animated=True).encode("utf-8")).decode("ascii")
        print("__PY_TURTLE_DATA__:" + _turtle_json.dumps({
            "svg": encoded,
            "animationSvg": animation,
            "animationDuration": 900,
            "title": "Turtle drawing"
        }))
        self.dirty = False


class _BrowserTurtle:
    def __init__(self, screen=None, shape=None):
        self.screen = screen or _browser_turtle_screen
        self.screen.turtles.append(self)
        self._reset_state()
        self.screen.dirty = True

    def _reset_state(self):
        self.x, self.y, self.angle = 0.0, 0.0, 0.0
        self.pen_color = self.fill_color = "black"
        self.line_width = 1.0
        self.pen_down = self.visible = True
        self._fill_points = None
        self._path = [(self.x, self.y)]

    def _move_to(self, x, y):
        x, y = float(x), float(y)
        if self.pen_down:
            x1, y1 = self.screen._point(self.x, self.y)
            x2, y2 = self.screen._point(x, y)
            element = f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{_turtle_color(self.pen_color)}" stroke-width="{self.line_width:.2f}" stroke-linecap="round"/>'
            self.screen._append(id(self), element, animated=True)
        self.x, self.y = x, y
        self._path.append((x, y))
        if self._fill_points is not None:
            self._fill_points.append((x, y))
        self.screen.dirty = True

    def forward(self, distance):
        angle = _turtle_math.radians(self.angle)
        distance = float(distance)
        self._move_to(self.x + distance * _turtle_math.cos(angle), self.y + distance * _turtle_math.sin(angle))

    fd = forward

    def backward(self, distance):
        self.forward(-float(distance))

    back = backward
    bk = backward

    def left(self, degrees):
        self.angle = (self.angle + float(degrees)) % 360
        self.screen.dirty = True

    lt = left

    def right(self, degrees):
        self.left(-float(degrees))

    rt = right

    def goto(self, x, y=None):
        if y is None:
            x, y = x
        self._move_to(x, y)

    setpos = goto
    setposition = goto

    def setx(self, x):
        self._move_to(x, self.y)

    def sety(self, y):
        self._move_to(self.x, y)

    def setheading(self, angle):
        self.angle = float(angle) % 360
        self.screen.dirty = True

    seth = setheading

    def home(self):
        self.setheading(0)
        self.goto(0, 0)

    def circle(self, radius, extent=None, steps=None):
        radius = float(radius)
        extent = 360.0 if extent is None else float(extent)
        count = max(1, int(steps)) if steps else max(12, int(abs(extent) / 8))
        step_angle = extent / count
        chord = 2 * abs(radius) * _turtle_math.sin(abs(_turtle_math.radians(step_angle)) / 2)
        direction = 1 if radius >= 0 else -1
        for _ in range(count):
            self.left(step_angle * direction)
            self.forward(chord)

    def penup(self):
        self.pen_down = False

    pu = penup
    up = penup

    def pendown(self):
        self.pen_down = True

    pd = pendown
    down = pendown

    def isdown(self):
        return self.pen_down

    def pensize(self, width=None):
        if width is not None:
            self.line_width = max(0.1, min(100.0, float(width)))
        return self.line_width

    width = pensize

    def pencolor(self, *colors):
        if colors:
            self.pen_color = _turtle_color(colors[0])
            self.screen.dirty = True
        return self.pen_color

    def fillcolor(self, *colors):
        if colors:
            self.fill_color = _turtle_color(colors[0])
        return self.fill_color

    def color(self, *colors):
        if len(colors) == 1:
            self.pen_color = self.fill_color = _turtle_color(colors[0])
        elif len(colors) > 1:
            self.pen_color, self.fill_color = _turtle_color(colors[0]), _turtle_color(colors[1])
        self.screen.dirty = True
        return self.pen_color, self.fill_color

    def begin_fill(self):
        self._fill_points = [(self.x, self.y)]

    def end_fill(self):
        if self._fill_points and len(self._fill_points) > 2:
            points = " ".join(
                f"{px:.2f},{py:.2f}" for px, py in (self.screen._point(x, y) for x, y in self._fill_points)
            )
            element = f'<polygon points="{points}" fill="{_turtle_color(self.fill_color)}" stroke="{_turtle_color(self.pen_color)}" stroke-width="{self.line_width:.2f}"/>'
            self.screen._append(id(self), element, filled=True, animated=True)
        self._fill_points = None

    def dot(self, size=None, *color):
        radius = max(1.0, float(size if size is not None else self.line_width + 4) / 2)
        x, y = self.screen._point(self.x, self.y)
        fill = _turtle_color(color[0] if color else self.pen_color)
        self.screen._append(id(self), f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{radius:.2f}" fill="{fill}"/>', animated=True)

    def write(self, text, move=False, align="left", font=("Arial", 10, "normal")):
        family = _turtle_html.escape(str(font[0]), quote=True) if len(font) > 0 else "Arial"
        size = max(1, min(128, int(font[1]))) if len(font) > 1 else 10
        weight = "bold" if len(font) > 2 and str(font[2]).lower() == "bold" else "normal"
        anchor = {"left": "start", "center": "middle", "right": "end"}.get(str(align), "start")
        x, y = self.screen._point(self.x, self.y)
        content = _turtle_html.escape(str(text))
        element = f'<text x="{x:.2f}" y="{y:.2f}" fill="{_turtle_color(self.pen_color)}" font-family="{family}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}">{content}</text>'
        self.screen._append(id(self), element, animated=True)
        if move:
            self.forward(len(str(text)) * size * 0.6)

    def clear(self):
        self.screen.items = [(owner, item, animated) for owner, item, animated in self.screen.items if owner != id(self)]
        self.screen.fills = [(owner, item, animated) for owner, item, animated in self.screen.fills if owner != id(self)]
        self.screen.dirty = True

    def reset(self):
        self.clear()
        self._reset_state()
        self.screen.dirty = True

    def speed(self, value=None):
        return 0 if value is None else value

    def hideturtle(self):
        self.visible = False
        self.screen.dirty = True

    ht = hideturtle

    def showturtle(self):
        self.visible = True
        self.screen.dirty = True

    st = showturtle

    def shape(self, name=None):
        return "classic" if name is None else name

    def position(self):
        return self.x, self.y

    pos = position

    def xcor(self):
        return self.x

    def ycor(self):
        return self.y

    def heading(self):
        return self.angle

    def towards(self, x, y=None):
        if y is None:
            x, y = x
        return _turtle_math.degrees(_turtle_math.atan2(float(y) - self.y, float(x) - self.x)) % 360

    def distance(self, x, y=None):
        if y is None:
            x, y = x
        return _turtle_math.hypot(float(x) - self.x, float(y) - self.y)

    def getscreen(self):
        return self.screen


_browser_turtle_screen = _BrowserTurtleScreen()
_browser_default_turtle = _BrowserTurtle(_browser_turtle_screen)
_browser_turtle_screen.dirty = False

def _begin_browser_turtle_execution():
    _browser_turtle_screen.clear()
    _browser_turtle_screen.background = "white"
    _browser_turtle_screen.turtles = [_browser_default_turtle]
    _browser_default_turtle.screen = _browser_turtle_screen
    _browser_default_turtle._reset_state()
    _browser_turtle_screen.dirty = False


_browser_turtle_module = _turtle_types.ModuleType("turtle")
_browser_turtle_module.Turtle = _BrowserTurtle
_browser_turtle_module.RawTurtle = _BrowserTurtle
_browser_turtle_module.Pen = _BrowserTurtle
_browser_turtle_module.Screen = lambda: _browser_turtle_screen
_browser_turtle_module.getscreen = lambda: _browser_turtle_screen
_browser_turtle_module.done = _browser_turtle_screen._emit
_browser_turtle_module.mainloop = _browser_turtle_screen._emit
_browser_turtle_module.__all__ = ["Turtle", "RawTurtle", "Pen", "Screen", "getscreen", "done", "mainloop"]


def _make_default_turtle_call(method_name):
    def call(*args, **kwargs):
        return getattr(_browser_default_turtle, method_name)(*args, **kwargs)
    return call


for _method_name in [
    "forward", "fd", "backward", "back", "bk", "left", "lt", "right", "rt", "goto",
    "setpos", "setposition", "setx", "sety", "setheading", "seth", "home", "circle",
    "penup", "pu", "up", "pendown", "pd", "down", "isdown", "pensize", "width",
    "pencolor", "fillcolor", "color", "begin_fill", "end_fill", "dot", "write", "clear",
    "reset", "speed", "hideturtle", "ht", "showturtle", "st", "shape", "position", "pos",
    "xcor", "ycor", "heading", "towards", "distance"
]:
    setattr(_browser_turtle_module, _method_name, _make_default_turtle_call(_method_name))
    _browser_turtle_module.__all__.append(_method_name)

for _screen_name in ["bgcolor", "screensize", "setup", "title", "tracer", "update", "bye", "exitonclick"]:
    setattr(_browser_turtle_module, _screen_name, getattr(_browser_turtle_screen, _screen_name))
    _browser_turtle_module.__all__.append(_screen_name)

_browser_turtle_module.colormode = lambda value=None: 1.0 if value is None else value
_browser_turtle_module.mode = lambda value=None: "standard" if value is None else value
_browser_turtle_module.__all__.extend(["colormode", "mode"])

_turtle_sys.modules["turtle"] = _browser_turtle_module


def _flush_browser_turtle():
    _browser_turtle_screen._emit()
`;

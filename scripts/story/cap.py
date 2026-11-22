# Models the graduation cap of the home page's Texas Tech chapter on the
# site's own head, in Blender (5.3), and writes it as
# components/Background/files/cap.bin (read by capGeometry.ts).
# Run, after export-head.mjs has written head.obj and eyes.json to a folder:
#   blender -b -P scripts/story/cap.py -- <folder> [render]
# With `render` it also writes three pictures of it there. It leaves
# cap.blend there too.
# The baked shade is sampled, so the file differs a little from run to run.
import bpy, bmesh, json, math, os, random, sys
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

args = sys.argv[sys.argv.index('--') + 1:]
HERE = args[0]
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# The head. OBJ (x, y up, z toward the face) comes in as Blender (x, -z, y):
# up is +Z, and the face looks down -Y.
bpy.ops.wm.obj_import(filepath=os.path.join(HERE, 'head.obj'), forward_axis='NEGATIVE_Z', up_axis='Y')
head = bpy.context.selected_objects[0]
head.name = 'Head'
bpy.context.view_layer.objects.active = head
# The import turns the object, not its points: bake the turn in, so the
# points are where they look.
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.shade_smooth()
to_blender = lambda p: Vector((p[0], -p[2], p[1]))
eyes = json.load(open(os.path.join(HERE, 'eyes.json')))
left, right = to_blender(eyes['left']), to_blender(eyes['right'])
U = abs(right.x - left.x)                       # the head's own measure
EYES = (left + right) / 2
verts = [head.matrix_world @ v.co for v in head.data.vertices]
TOP = max(verts, key=lambda v: v.z)

# The rim: high over the ears, dipping to a point on the forehead and
# another at the back.
SIDE_RIM, FRONT_POINT, BACK_POINT, POINT_WIDTH = 1.0, 0.5, 0.8, 1.05
side_z = EYES.z + U * SIDE_RIM
ring = [v for v in verts if abs(v.z - side_z) < U * 0.12]
CX = (min(v.x for v in ring) + max(v.x for v in ring)) / 2
CY = (min(v.y for v in ring) + max(v.y for v in ring)) / 2
REACH = max(abs(v.x - CX) for v in verts if v.z > EYES.z + U * 0.5)
def dip(round_, middle):
    d = abs(math.atan2(math.sin(round_ - middle), math.cos(round_ - middle)))
    # Straight at its tip (a point), easing into the sides (no kink there).
    return max(0.0, 1 - d / POINT_WIDTH) ** 1.6
def rim(round_):
    return side_z - U * (FRONT_POINT * dip(round_, 0) + BACK_POINT * dip(round_, math.pi))

# The crown: cast onto the skull itself. From a point inside the cranium,
# rays go out in every direction above the rim; where each meets the skin,
# set a little way off it, is a point of the cloth.
depsgraph = bpy.context.evaluated_depsgraph_get()
tree = BVHTree.FromObject(head, depsgraph)
O = Vector((CX, CY, EYES.z + U * 0.55))
def cast(round_, lift):
    # round_: 0 at the front (-Y), turning toward +X; lift: up from level.
    d = Vector((math.sin(round_) * math.cos(lift), -math.cos(round_) * math.cos(lift), math.sin(lift)))
    hit, normal, _, _ = tree.ray_cast(O, d)
    return hit, normal
AROUND, RINGS, GAP = 96, 18, U * 0.03
def rim_lift(round_):
    # The lift at which the ray meets the skin at the rim's height.
    lo, hi = -0.6, math.pi / 2
    for _ in range(30):
        mid = (lo + hi) / 2
        hit, _ = cast(round_, mid)
        if hit is None or hit.z < rim(round_): lo = mid
        else: hi = mid
    return hi
bm = bmesh.new()
uv_layer = bm.loops.layers.uv.new('UVMap')
grid = []
apex_hit, apex_normal = cast(0, math.pi / 2)
for i in range(AROUND):
    round_ = i / AROUND * math.tau
    low = rim_lift(round_)
    column = []
    for j in range(1, RINGS + 1):
        lift = math.pi / 2 - (math.pi / 2 - low) * (j / RINGS) ** 0.85
        hit, normal = cast(round_, lift)
        column.append(bm.verts.new(hit + normal * GAP))
    grid.append(column)
apex = bm.verts.new(apex_hit + apex_normal * GAP)
for i in range(AROUND):
    a, b = grid[i], grid[(i + 1) % AROUND]
    faces = [bm.faces.new((apex, a[0], b[0]))]
    for j in range(RINGS - 1):
        faces.append(bm.faces.new((a[j], a[j + 1], b[j + 1], b[j])))
    for f in faces:
        for loop in f.loops:
            v = loop.vert
            if v is apex: loop[uv_layer].uv = ((i + 0.5) / AROUND, 0)
            else:
                col = i if v in a else i + 1
                row = (a if v in a else b).index(v) + 1
                loop[uv_layer].uv = (col / AROUND, row / RINGS)
mesh = bpy.data.meshes.new('Crown')
bm.normal_update()
bm.to_mesh(mesh); bm.free()
crown = bpy.data.objects.new('Crown', mesh)
scene.collection.objects.link(crown)
for p in mesh.polygons: p.use_smooth = True
# Cloth has a thickness, and its edge is turned under into a hem.
solid = crown.modifiers.new('Solidify', 'SOLIDIFY')
solid.thickness = U * 0.05; solid.offset = 1
sub = crown.modifiers.new('Subsurf', 'SUBSURF'); sub.levels = sub.render_levels = 1

# The board: a stiff square under cloth, its edges rounded; a little wider
# than the head, resting on the crown, its front tipped up a little: the
# page looks at the head from about its own height, and a level board seen
# from there is only an edge.
SIDE, THICK = REACH * 2.3, U * 0.085
bpy.ops.mesh.primitive_cube_add(size=1)
board = bpy.context.active_object; board.name = 'Board'
board.scale = (SIDE, SIDE, THICK)
bpy.ops.object.transform_apply(scale=True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.subdivide(number_cuts=18)
bpy.ops.object.mode_set(mode='OBJECT')
bevel = board.modifiers.new('Bevel', 'BEVEL'); bevel.width = THICK * 0.42; bevel.segments = 4; bevel.limit_method = 'ANGLE'
bpy.ops.object.shade_smooth()
PLACE = Matrix.Translation(Vector((CX, CY - U * 0.05, TOP.z + GAP + THICK * 0.45))) @ Matrix.Rotation(math.radians(-9), 4, 'X')
board.matrix_world = PLACE

# The button in the middle of the board.
bpy.ops.mesh.primitive_uv_sphere_add(radius=U * 0.085, segments=32, ring_count=16)
button = bpy.context.active_object; button.name = 'Button'
button.scale.z = 0.42
bpy.ops.object.shade_smooth()
button.matrix_world = PLACE @ Matrix.Translation(Vector((0, 0, THICK * 0.5))) @ Matrix.Scale(0.42, 4, Vector((0, 0, 1)))

def tube(name, points, radius, sides=2):
    curve = bpy.data.curves.new(name, 'CURVE'); curve.dimensions = '3D'
    curve.bevel_depth = radius; curve.bevel_resolution = sides; curve.resolution_u = 6
    spline = curve.splines.new('NURBS'); spline.points.add(len(points) - 1)
    for p, co in zip(spline.points, points): p.co = (*co, 1)
    spline.use_endpoint_u = True; spline.order_u = min(4, len(points))
    obj = bpy.data.objects.new(name, curve); scene.collection.objects.link(obj)
    return obj

# The cord: from the button across the board, over the middle of its front
# left quarter, and down past the brow, swinging a little.
edge = SIDE / 2
tx, ty = edge * 0.62, -edge
on = lambda x, y, z: PLACE @ Vector((x, y, z))
hang = on(tx * 1.02, ty * 1.04, THICK * 0.1)
DROP = U * 0.78
tip = hang + Vector((U * 0.02, -U * 0.03, -DROP))
cord = tube('Cord', [on(0, 0, THICK * 0.62), on(tx * 0.3, ty * 0.3, THICK * 0.66), on(tx * 0.7, ty * 0.7, THICK * 0.64), on(tx * 0.98, ty * 0.985, THICK * 0.6), hang, hang + Vector((0, -U * 0.02, -DROP * 0.35)), tip], U * 0.017)

# The tassel: a gold band binding a skirt of strands, each hanging a little
# differently, with a knot above the band.
bpy.ops.mesh.primitive_cylinder_add(radius=U * 0.042, depth=U * 0.1, vertices=28)
band = bpy.context.active_object; band.name = 'Band'
band.location = tip + Vector((0, 0, -U * 0.03)); bpy.ops.object.shade_smooth()
bevel = band.modifiers.new('Bevel', 'BEVEL'); bevel.width = U * 0.008; bevel.segments = 2
bpy.ops.mesh.primitive_uv_sphere_add(radius=U * 0.046, segments=24, ring_count=12)
knot = bpy.context.active_object; knot.name = 'Knot'
knot.location = tip + Vector((0, 0, U * 0.045)); bpy.ops.object.shade_smooth()
strands = []
base = tip + Vector((0, 0, -U * 0.07))
for n in range(72):
    a = random.uniform(0, math.tau)
    r0 = U * 0.032 * math.sqrt(random.random())
    r1 = r0 + U * random.uniform(0.012, 0.05)
    length = U * random.uniform(0.4, 0.5)
    sway = Vector((random.uniform(-1, 1), random.uniform(-1, 1), 0)) * U * 0.012
    p0 = base + Vector((math.cos(a) * r0, math.sin(a) * r0, 0))
    p3 = base + Vector((math.cos(a) * r1, math.sin(a) * r1, -length)) + sway
    strands.append(tube(f'Strand{n}', [p0, p0.lerp(p3, 0.35) + sway * 0.4, p0.lerp(p3, 0.7) + sway, p3], U * 0.0065, sides=1))

# Each part as one mesh.
def joined(name, objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.convert(target='MESH')
    if len(objects) > 1: bpy.ops.object.join()
    out = bpy.context.active_object; out.name = name
    return out
crown = joined('Crown', [crown])
board = joined('Board', [board, button])
tassel = joined('Tassel', [cord, knot] + strands)
gold = joined('Gold', [band])

def material(name, color, rough, metal=0.0, sheen=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if 'Sheen Weight' in b.inputs: b.inputs['Sheen Weight'].default_value = sheen
    return m
cloth = material('Cloth', (0.012, 0.012, 0.014), 0.85, sheen=0.6)
for o, m in ((crown, cloth), (board, cloth), (tassel, material('Scarlet', (0.6, 0.0, 0.0), 0.6, sheen=0.4)), (gold, material('GoldM', (0.83, 0.61, 0.2), 0.3, 1.0)), (head, material('Skin', (0.01, 0.012, 0.05), 0.2))):
    o.data.materials.clear(); o.data.materials.append(m)

if 'render' in args:
    scene.render.engine = 'CYCLES'; scene.cycles.samples = 48; scene.cycles.device = 'CPU'
    scene.render.resolution_x, scene.render.resolution_y = 900, 760
    world = bpy.data.worlds.new('World'); scene.world = world; world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.55, 0.5, 0.7, 1); world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.9
    sun = bpy.data.lights.new('Sun', 'SUN'); sun.energy = 3.5; sun.angle = 0.3
    so = bpy.data.objects.new('Sun', sun); scene.collection.objects.link(so); so.rotation_euler = (math.radians(50), 0, math.radians(-35))
    cam = bpy.data.cameras.new('Cam'); cam.lens = 70
    co = bpy.data.objects.new('Cam', cam); scene.collection.objects.link(co); scene.camera = co
    target = Vector((CX, CY, EYES.z + U * 1.0))
    for name, where in (('front', Vector((U * 2.2, -U * 13, U * 1.2))), ('side', Vector((U * 11, -U * 7, U * 2.0))), ('close', Vector((U * 3.0, -U * 6.5, U * 0.6)))):
        co.location = target + where
        co.rotation_euler = (target - co.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = os.path.join(HERE, f'render-{name}.png')
        bpy.ops.render.render(write_still=True)

# Soft shadow where surfaces are close (under the board, in the hem, among
# the strands), baked into each part's points: the page has no shadows of
# its own to give them.
scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 64
scene.render.bake.target = 'VERTEX_COLORS'
parts = {'crown': crown, 'board': board, 'tassel': tassel, 'gold': gold}
for o in parts.values():
    layer = o.data.color_attributes.new('AO', 'FLOAT_COLOR', 'POINT')
    o.data.color_attributes.active_color = layer
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.bake(type='AO')

# The file (components/Background/capGeometry.ts says how it is laid out):
# as glasses.bin, with each part's normals, its shade (a byte a point) and,
# where it has them, its cloth coordinates.
import gzip, struct
import numpy as np
UNIT = 200
header, chunks, offset = {'unit': UNIT, 'parts': {}}, [], 0
def push(array):
    global offset
    raw = array.tobytes(); pad = (4 - len(raw) % 4) % 4
    chunks.append(raw + b'\0' * pad); at = offset; offset += len(raw) + pad
    return at
for name, o in parts.items():
    m = o.data
    m.calc_loop_triangles()
    # A part that was placed as a whole (the board, the band) keeps its
    # points where it was made: they are written where they stand.
    turn = o.matrix_world.to_3x3()
    uv = m.uv_layers.active.data if name in ('crown', 'board') and m.uv_layers.active else None
    ao = m.color_attributes['AO'].data
    seen, position, normal, shade, coords, index = {}, [], [], [], [], []
    for tri in m.loop_triangles:
        for loop in tri.loops:
            v = m.loops[loop].vertex_index
            n = (turn @ m.corner_normals[loop].vector).normalized()
            t = tuple(round(c, 4) for c in uv[loop].uv) if uv else ()
            key = (v, round(n.x, 2), round(n.y, 2), round(n.z, 2), t)
            if key not in seen:
                seen[key] = len(position) // 3
                co = o.matrix_world @ m.vertices[v].co
                # Back to the page's axes: (x, up, toward the face).
                position += [co.x, co.z, -co.y]; normal += [n.x, n.z, -n.y]
                shade.append(ao[v].color[0]); coords += list(t)
            index.append(seen[key])
    count = len(position) // 3
    part = {'vertices': count, 'triangles': len(index) // 3,
            'position': push(np.round(np.array(position) * UNIT).astype('<i2')),
            'normal': push(np.round(np.array(normal) * 127).astype('i1')),
            'shade': push(np.round(np.clip(np.array(shade), 0, 1) * 255).astype('u1'))}
    if uv: part['uv'] = push(np.array(coords, dtype='<f4'))
    part['index'] = push(np.array(index, dtype='<u4' if count > 65535 else '<u2'))
    header['parts'][name] = part
text = json.dumps(header).encode()
lead = struct.pack('<I', len(text)); pad = b'\0' * ((4 - (4 + len(text)) % 4) % 4)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../components/Background/files/cap.bin')
with open(out, 'wb') as f: f.write(gzip.compress(lead + text + pad + b''.join(chunks), 9, mtime=0))
print('WROTE', out, os.path.getsize(out), {k: (v['vertices'], v['triangles']) for k, v in header['parts'].items()})
print('CAP', {o.name: len(o.data.vertices) for o in (crown, board, tassel, gold)}, 'U', round(U, 2), 'REACH', round(REACH, 2))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'cap.blend'))

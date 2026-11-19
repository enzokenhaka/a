import {
  Component,
  Suspense,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
  type MutableRefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
export type MotionState = {
  progress: number;
  powered: boolean;
  reduced: boolean;
  drag?: number;
  pointerX?: number;
  pointerY?: number;
  invalidate?: () => void;
  manual?: boolean;
  exploded?: number;
  rotation?: number;
  finish?: "copper" | "graphite";
};
function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
function labelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const c = canvas.getContext("2d")!;
  c.fillStyle = "#C5A059";
  c.textAlign = "center";
  c.font = "500 48px sans-serif";
  c.fillText("M I S T E R", 256, 190);
  c.font = "bold 100px sans-serif";
  c.fillText("OS", 256, 300);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function RepeatedDetails({ kind }: { kind: "grip" | "teeth" }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const count = kind === "grip" ? 17 : 19;
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new THREE.Object3D();
    for (let index = 0; index < count; index++) {
      if (kind === "grip") {
        transform.position.set(0, -1.52 + index * 0.083, 0.515);
        transform.scale.set(1.13 - index * 0.008, 0.025, 0.045);
      } else {
        transform.position.set(-0.87 + index * 0.097, 2.21, 0.39);
        transform.scale.set(0.058, 0.27, 0.12);
      }
      transform.updateMatrix();
      mesh.current.setMatrixAt(index, transform.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [kind, count]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={kind === "grip" ? "#454743" : "#d0d1c7"}
        roughness={kind === "grip" ? 0.45 : 0.2}
        metalness={kind === "grip" ? 0.65 : 1}
      />
    </instancedMesh>
  );
}
function InternalMechanism() {
  return (
    <>
      <RoundedBox
        args={[1.12, 3.1, 0.12]}
        radius={0.13}
        position={[0, -0.15, 0.41]}
      >
        <meshStandardMaterial
          color="#111714"
          roughness={0.65}
          metalness={0.15}
        />
      </RoundedBox>
      <mesh position={[0, 0.64, 0.57]}>
        <cylinderGeometry args={[0.3, 0.3, 1.15, 32]} />
        <meshStandardMaterial
          color="#969b91"
          metalness={0.9}
          roughness={0.24}
        />
      </mesh>
      {[0.13, 1.15].map((y) => (
        <mesh key={y} position={[0, y, 0.57]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.035, 8, 32]} />
          <meshStandardMaterial
            color="#393f37"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      ))}
      <mesh position={[0, 1.36, 0.57]}>
        <cylinderGeometry args={[0.065, 0.065, 0.3, 16]} />
        <meshStandardMaterial color="#b9bcb0" metalness={1} roughness={0.2} />
      </mesh>
      <RoundedBox
        args={[0.67, 1.1, 0.22]}
        radius={0.08}
        position={[0, -1.06, 0.54]}
      >
        <meshStandardMaterial
          color="#272d27"
          metalness={0.45}
          roughness={0.4}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.87, 0.4, 0.065]}
        radius={0.025}
        position={[0, -0.23, 0.56]}
      >
        <meshStandardMaterial
          color="#304437"
          metalness={0.25}
          roughness={0.55}
        />
      </RoundedBox>
      {[-0.3, -0.1, 0.1, 0.3].map((x) => (
        <mesh key={x} position={[x, -0.23, 0.62]}>
          <boxGeometry args={[0.09, 0.13, 0.045]} />
          <meshStandardMaterial
        color="#C5A059"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
      ))}
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, -0.7, 0.55]}>
          <boxGeometry args={[0.025, 1.5, 0.025]} />
          <meshStandardMaterial
            color="#A37F3D"
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>
      ))}
    </>
  );
}
function Body({ motion }: { motion: MutableRefObject<MotionState> }) {
  const root = useRef<THREE.Group>(null),
    head = useRef<THREE.Group>(null),
    shell = useRef<THREE.Group>(null),
    core = useRef<THREE.Group>(null),
    lever = useRef<THREE.Group>(null),
    led = useRef<THREE.MeshStandardMaterial>(null),
    caseMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const texture = useMemo(labelTexture, []);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.43, -2.2);
    s.bezierCurveTo(-0.85, -2.2, -0.85, -1.9, -0.82, -1.5);
    s.lineTo(-0.71, 0.55);
    s.bezierCurveTo(-0.71, 0.9, -0.88, 1.12, -0.83, 1.45);
    s.quadraticCurveTo(-0.82, 1.6, -0.62, 1.6);
    s.lineTo(0.62, 1.6);
    s.quadraticCurveTo(0.82, 1.6, 0.83, 1.45);
    s.bezierCurveTo(0.88, 1.12, 0.71, 0.9, 0.71, 0.55);
    s.lineTo(0.82, -1.5);
    s.bezierCurveTo(0.85, -1.9, 0.85, -2.2, 0.43, -2.2);
    s.closePath();
    return s;
  }, []);
  const geometry = useMemo(
    () =>
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.58,
        bevelEnabled: true,
        bevelSize: 0.13,
        bevelThickness: 0.13,
        bevelSegments: 5,
        steps: 1,
        curveSegments: 24,
      }),
    [shape],
  );
  const invalidate = useThree((state) => state.invalidate);
  const powerState = useRef<boolean | null>(null);
  const finishState = useRef<string>("");
  const detailProgress = useRef(0);
  const finishColor = useMemo(() => new THREE.Color("#17191c"), []);
  useEffect(() => {
    motion.current.invalidate = invalidate;
    invalidate();
    return () => {
      if (motion.current.invalidate === invalidate)
        motion.current.invalidate = undefined;
    };
  }, [invalidate, motion]);
  useFrame(({ clock }, delta) => {
    if (!root.current) return;
    const {
      progress: p,
      reduced,
      powered,
      drag = 0,
      pointerX = 0,
      pointerY = 0,
      manual = false,
      exploded = 0,
      rotation = 0,
      finish = "copper",
    } = motion.current;
    // ScrollTrigger is the single source of progress. Only the pointer and
    // mechanical details need damping; adding a second scroll ease creates lag.
    const targetDetail = manual
      ? exploded
      : THREE.MathUtils.smoothstep(p, 0.36, 0.49) *
        (1 - THREE.MathUtils.smoothstep(p, 0.62, 0.77));
    const detail = THREE.MathUtils.damp(
      detailProgress.current,
      targetDetail,
      14,
      Math.min(delta, 0.05),
    );
    detailProgress.current = detail;
    const turn = manual
      ? rotation
      : THREE.MathUtils.smoothstep(p, 0.02, 0.4) * Math.PI * 2 +
        Math.sin(THREE.MathUtils.smoothstep(p, 0.4, 1) * Math.PI) * 0.55;
    const targetY = -0.42 + turn + drag + (reduced ? 0 : pointerX * 0.13);
    const targetZ =
      -0.18 +
      Math.sin(p * Math.PI * 2) * 0.17 +
      (reduced ? 0 : pointerY * 0.035);
    const targetX = 0.12 - Math.sin(p * Math.PI) * 0.27;
    const step = Math.min(delta, 0.05);
    root.current.rotation.y = THREE.MathUtils.damp(
      root.current.rotation.y,
      targetY,
      14,
      step,
    );
    root.current.rotation.z = THREE.MathUtils.damp(
      root.current.rotation.z,
      targetZ,
      14,
      step,
    );
    root.current.rotation.x = THREE.MathUtils.damp(
      root.current.rotation.x,
      targetX,
      14,
      step,
    );
    root.current.position.y = Math.sin(p * Math.PI) * 0.08 - detail * 0.3;
    root.current.position.x = -detail * 0.24;
    root.current.scale.setScalar(1 - detail * 0.13);
    if (core.current) core.current.visible = detail > 0.01;
    if (caseMaterial.current && finishState.current !== finish) {
      finishColor.set(finish === "graphite" ? "#0d0f12" : "#17191c");
      caseMaterial.current.metalness = finish === "graphite" ? 0.32 : 0.55;
      caseMaterial.current.roughness = finish === "graphite" ? 0.48 : 0.4;
      finishState.current = finish;
    }
    if (caseMaterial.current)
      caseMaterial.current.color.lerp(finishColor, 1 - Math.exp(-14 * step));
    if (head.current)
      head.current.position.y =
        detail * 0.7 +
        (powered && !reduced ? Math.sin(clock.elapsedTime * 90) * 0.006 : 0);
    if (shell.current) {
      shell.current.position.z = detail * 0.56;
      shell.current.position.x = detail * 0.88;
      shell.current.rotation.y = -detail * 0.15;
    }
    if (lever.current) lever.current.rotation.x = powered ? -0.22 : 0;
    if (led.current && powerState.current !== powered) {
      led.current.emissiveIntensity = powered ? 2.5 : 0.12;
      led.current.color.set(powered ? "#C5A059" : "#544817");
      powerState.current = powered;
    }
    const settling =
      Math.abs(root.current.rotation.y - targetY) +
        Math.abs(root.current.rotation.z - targetZ) +
        Math.abs(root.current.rotation.x - targetX) >
      0.0005;
    const colorSettling = caseMaterial.current
      ? Math.abs(caseMaterial.current.color.r - finishColor.r) +
          Math.abs(caseMaterial.current.color.g - finishColor.g) +
          Math.abs(caseMaterial.current.color.b - finishColor.b) >
        0.001
      : false;
    if (
      settling ||
      colorSettling ||
      Math.abs(detail - targetDetail) > 0.0005 ||
      (powered && !reduced)
    )
      invalidate();
  });
  return (
    <group ref={root} position={[0, 0, 0]} rotation={[0.12, -0.42, -0.18]}>
      <mesh geometry={geometry} position={[0, 0, -0.34]}>
        <meshStandardMaterial
          color="#34373b"
          metalness={0.93}
          roughness={0.25}
        />
      </mesh>
      <group ref={core} visible={false}>
        <InternalMechanism />
      </group>
      <group ref={shell}>
        <mesh
          geometry={geometry}
          scale={[0.945, 0.975, 0.9]}
          position={[0, 0, -0.29]}
        >
          <meshStandardMaterial
            ref={caseMaterial}
            color="#17191c"
            metalness={0.55}
            roughness={0.4}
          />
        </mesh>
        <RoundedBox
          args={[1.21, 1.85, 0.11]}
          radius={0.19}
          smoothness={5}
          position={[0, -0.82, 0.45]}
        >
          <meshStandardMaterial
            color="#101312"
            roughness={0.55}
            metalness={0.3}
          />
        </RoundedBox>
        <RepeatedDetails kind="grip" />
        <mesh position={[0, 0.82, 0.458]}>
          <planeGeometry args={[1.15, 1.15]} />
          <meshBasicMaterial
            map={texture}
            transparent
            polygonOffset
            polygonOffsetFactor={-1}
          />
        </mesh>
        <RoundedBox
          args={[0.25, 0.43, 0.09]}
          radius={0.06}
          position={[0, -1.91, 0.46]}
        >
          <meshStandardMaterial
            color="#A37F3D"
            metalness={0.85}
            roughness={0.2}
          />
        </RoundedBox>
        <mesh position={[0, -1.91, 0.519]}>
          <circleGeometry args={[0.04, 20]} />
          <meshStandardMaterial ref={led} color="#544817" emissive="#C5A059" />
        </mesh>
      </group>
      <group ref={head}>
        <RoundedBox
          args={[1.8, 0.43, 0.58]}
          radius={0.09}
          position={[0, 1.68, 0.03]}
        >
          <meshStandardMaterial
            color="#9d9e95"
            metalness={1}
            roughness={0.23}
          />
        </RoundedBox>
        <RoundedBox
          args={[1.9, 0.4, 0.12]}
          radius={0.045}
          position={[0, 1.98, 0.39]}
        >
          <meshStandardMaterial
            color="#cccdc4"
            metalness={1}
            roughness={0.22}
          />
        </RoundedBox>
        <RepeatedDetails kind="teeth" />
        {[-0.52, 0.52].map((x) => (
          <group key={x} position={[x, 1.96, 0.47]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.085, 0.085, 0.04, 24]} />
              <meshStandardMaterial
                color="#222824"
                metalness={0.9}
                roughness={0.28}
              />
            </mesh>
            <mesh position={[0, 0, 0.03]} rotation={[0, 0, 0.4]}>
              <boxGeometry args={[0.1, 0.013, 0.02]} />
              <meshStandardMaterial color="#8a8b82" metalness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
      <group ref={lever} position={[-0.84, 0.94, 0]}>
        <mesh rotation={[0, 0, -0.45]} position={[-0.17, -0.12, 0]}>
          <boxGeometry args={[0.1, 0.55, 0.13]} />
          <meshStandardMaterial
            color="#C5A059"
            metalness={0.9}
            roughness={0.23}
          />
        </mesh>
        <RoundedBox
          args={[0.18, 0.18, 0.3]}
          radius={0.035}
          position={[-0.3, -0.38, 0]}
        >
          <meshStandardMaterial
            color="#a8aaa0"
            metalness={1}
            roughness={0.25}
          />
        </RoundedBox>
      </group>
      <mesh position={[0, -2.29, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.035, 10, 32]} />
        <meshStandardMaterial color="#959991" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
}
class CanvasBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="webgl-fallback">
        <img
          src="/barber-working.webp"
          alt="Barbeiro fazendo o acabamento de um corte"
        />
        <span>Precisão em cada detalhe.</span>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Clipper({
  motion,
}: {
  motion: MutableRefObject<MotionState>;
}) {
  const [available] = useState(webglAvailable),
    [visible, setVisible] = useState(true),
    host = useRef<HTMLDivElement>(null),
    last = useRef<number | null>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => setVisible(entries[0].isIntersecting),
      { rootMargin: "150px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (visible) motion.current.invalidate?.();
  }, [visible, motion]);
  return (
    <div
      ref={host}
      style={{ width: "100%", height: "100%" }}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") {
          last.current = e.clientX;
          e.currentTarget.setPointerCapture(e.pointerId);
        }
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const bounds = e.currentTarget.getBoundingClientRect();
        motion.current.pointerX =
          ((e.clientX - bounds.left) / bounds.width - 0.5) * 2;
        motion.current.pointerY =
          ((e.clientY - bounds.top) / bounds.height - 0.5) * 2;
        motion.current.invalidate?.();
        if (last.current !== null) {
          motion.current.drag =
            (motion.current.drag || 0) + (e.clientX - last.current) * 0.008;
          last.current = e.clientX;
        }
      }}
      onPointerUp={() => {
        last.current = null;
      }}
      onPointerCancel={() => {
        last.current = null;
      }}
      onPointerLeave={() => {
        motion.current.pointerX = 0;
        motion.current.pointerY = 0;
        motion.current.invalidate?.();
      }}
    >
      <CanvasBoundary>
        {available ? (
          <Canvas
            frameloop={visible ? "demand" : "never"}
            dpr={[
              1,
              window.matchMedia("(max-width: 700px)").matches ? 1.25 : 1.5,
            ]}
            camera={{
              position: [0, 0, motion.current.manual ? 10.6 : 9.6],
              fov: 38,
            }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            fallback={
              <div className="webgl-fallback">
                <img
                  src="/barber-working.webp"
                  alt="Corte feito com precisão"
                />
              </div>
            }
          >
            <ambientLight intensity={0.8} />
            <spotLight
              position={[3, 5, 5]}
              intensity={45}
              angle={0.5}
              penumbra={1}
              color="#f4f5f0"
            />
            <pointLight position={[-4, 1, 3]} intensity={18} color="#9b8658" />
            <Suspense fallback={null}>
              <Body motion={motion} />
              <Environment resolution={128}>
                <Lightformer
                  intensity={3}
                  position={[0, 4, 2]}
                  scale={[6, 1, 1]}
                />
                <Lightformer
                  intensity={4}
                  position={[4, 0, 2]}
                  rotation={[0, -Math.PI / 2, 0]}
                  scale={[1, 7, 1]}
                />
                <Lightformer
                  color="#d7b596"
                  intensity={2}
                  position={[-4, 0, 1]}
                  rotation={[0, Math.PI / 2, 0]}
                  scale={[1, 8, 1]}
                />
              </Environment>
            </Suspense>
          </Canvas>
        ) : (
          <div className="webgl-fallback">
            <img
              src="/barber-working.webp"
              alt="Acabamento feito por um barbeiro"
            />
            <span>Precisão em cada detalhe.</span>
          </div>
        )}
      </CanvasBoundary>
    </div>
  );
}

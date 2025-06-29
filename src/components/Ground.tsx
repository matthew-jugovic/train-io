import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect, useState, Suspense, type FC } from "react";
import { DoubleSide, Mesh, RepeatWrapping, Vector3 } from "three";
import { useTexture } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

type GroundProps = {
  textureUrl: string;
  size?: number;
};

const Ground = ({ textureUrl, size = 500 }: GroundProps) => {
  const texture = useTexture(textureUrl);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(5, 5);
  texture.needsUpdate = true;

  return (
    <RigidBody type="fixed">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="white" side={DoubleSide} map={texture} />
      </mesh>
    </RigidBody>
  );
};

export default Ground;

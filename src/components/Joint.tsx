import {
  quat,
  RapierRigidBody,
  RigidBody,
  useSphericalJoint,
  vec3,
} from "@react-three/rapier";
import type { RefObject } from "react";
const cartLength = 6;
const gap = 2.3;
type JointProps = {
  carRef1: RefObject<RapierRigidBody>;
  carRef2: RefObject<RapierRigidBody>;
};
export default function Joint({ carRef1, carRef2 }: JointProps) {
  useSphericalJoint(carRef1, carRef2, [
    [0, 0.25, cartLength / 2], // front of blue cart
    [0, 0.25, -cartLength / 2 - gap], // back of red cart, offset by gap
  ]);
  return null;
}

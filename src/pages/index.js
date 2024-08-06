import Head from "next/head";
import styles from "@/styles/Home.module.css";
import MainLayout from "@/layout/mainLayout";
import { useEffect, useRef } from "react";

export default function Home() {
  const canvasRef = useRef(null);
  const IsComponentMount = useRef(false);

  useEffect(() => {
    IsComponentMount.current = true;

    let cube;

    (async () => {
      const THREE = await import("three");
      const {Cube} = await import("../cube.js");
      const { gsap } = await import("gsap");

      if(!IsComponentMount.current) {
        return;
      }
      window.THREE = THREE;
      window.gsap = gsap;

      cube = new Cube(canvasRef.current);
      cube.init(0);

      
    })();

    return () => {
      if(cube)
        cube.destroy();
      IsComponentMount.current = false;
    };
  }, []);


  return (
    <canvas ref={canvasRef} style={{width: "100vw", height: "100vh", overflow: "hidden"}}></canvas>
  );
}

Home.getLayout = function getLayout(page) {
  return (
    <MainLayout>
      {page}
    </MainLayout>
  )
}
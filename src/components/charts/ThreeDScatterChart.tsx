import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface ThreeDScatterChartProps {
  data: any[];
  xKey?: string;
  yKey?: string;
  zKey?: string;
  colorKey?: string;
}

export const ThreeDScatterChart: React.FC<ThreeDScatterChartProps> = ({
  data,
  xKey = 'x',
  yKey = 'y',
  zKey = 'z',
  colorKey = 'type',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.5 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / 3;

    // Normalize data
    const normalizedData = data.map((d) => ({
      x: (d[xKey] || 0) / 10 - 0.5, // Assuming range 0-10, center at 0
      y: (d[yKey] || 0) / 10 - 0.5,
      z: (d[zKey] || 0) / 10 - 0.5,
      color: d[colorKey] === 'Anomaly' ? '#ef4444' : '#10b981',
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw axes
      const axes = [
        { x: -0.6, y: -0.6, z: -0.6 },
        { x: 0.6, y: -0.6, z: -0.6 }, // X
        { x: -0.6, y: 0.6, z: -0.6 }, // Y
        { x: -0.6, y: -0.6, z: 0.6 }, // Z
      ];

      const project = (p: { x: number; y: number; z: number }) => {
        // Simple rotation matrix
        const cosX = Math.cos(rotation.x);
        const sinX = Math.sin(rotation.x);
        const cosY = Math.cos(rotation.y);
        const sinY = Math.sin(rotation.y);

        let x = p.x;
        let y = p.y;
        let z = p.z;

        // Rotate Y
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;
        x = x1;
        z = z1;

        // Rotate X
        let y1 = y * cosX - z * sinX;
        let z2 = y * sinX + z * cosX;
        y = y1;
        z = z2;

        // Perspective
        const fov = 2;
        const dist = 3;
        const factor = fov / (dist + z);

        return {
          x: centerX + x * scale * factor,
          y: centerY - y * scale * factor, // Invert Y for canvas
          z: z,
          scale: factor,
        };
      };

      // Draw box
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      
      const corners = [
        { x: -0.5, y: -0.5, z: -0.5 }, { x: 0.5, y: -0.5, z: -0.5 },
        { x: 0.5, y: 0.5, z: -0.5 }, { x: -0.5, y: 0.5, z: -0.5 },
        { x: -0.5, y: -0.5, z: 0.5 }, { x: 0.5, y: -0.5, z: 0.5 },
        { x: 0.5, y: 0.5, z: 0.5 }, { x: -0.5, y: 0.5, z: 0.5 },
      ];
      
      const projectedCorners = corners.map(project);
      
      // Draw edges (simplified cube)
      const edges = [
        [0,1], [1,2], [2,3], [3,0], // Back face
        [4,5], [5,6], [6,7], [7,4], // Front face
        [0,4], [1,5], [2,6], [3,7]  // Connecting edges
      ];

      edges.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(projectedCorners[i].x, projectedCorners[i].y);
        ctx.lineTo(projectedCorners[j].x, projectedCorners[j].y);
        ctx.stroke();
      });

      // Draw points
      // Sort by Z for simple depth handling
      const projectedPoints = normalizedData.map(d => ({ ...project(d), color: d.color }))
        .sort((a, b) => a.z - b.z);

      projectedPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.stroke();
      });
    };

    draw();
  }, [data, rotation, xKey, yKey, zKey, colorKey]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setRotation({
      x: rotation.x + dy * 0.01,
      y: rotation.y + dx * 0.01,
    });
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      className="w-full h-full cursor-move touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};

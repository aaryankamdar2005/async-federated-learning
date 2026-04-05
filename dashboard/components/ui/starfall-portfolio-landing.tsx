"use client";
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// --- TYPE DEFINITIONS FOR PROPS ---
interface NavLink { label: string; href: string; }
interface Project { title: string; description: string; tags: string[]; imageContent?: React.ReactNode; }
interface Stat { value: string; label: string; }

export interface PortfolioPageProps {
  logo?: { initials: React.ReactNode; name: React.ReactNode; };
  navLinks?: NavLink[];
  resume?: { label: string; onClick?: () => void; };
  hero?: { titleLine1: React.ReactNode; titleLine2Gradient: React.ReactNode; subtitle: React.ReactNode; };
  ctaButtons?: { primary: { label: string; onClick?: () => void; }; secondary: { label: string; onClick?: () => void; }; };
  projects?: Project[];
  stats?: Stat[];
  showAnimatedBackground?: boolean;
}

// --- THREE.JS FEDERATED LEARNING HERO ---
const FederatedLearningBackground: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;
        const currentMount = mountRef.current;
        
        const scene = new THREE.Scene();
        // Add minimal ambient fog for depth
        scene.fog = new THREE.FogExp2(0x06091a, 0.002);
        
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 150;
        camera.position.y = 30;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.domElement.style.position = 'fixed';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.zIndex = '0';
        currentMount.appendChild(renderer.domElement);

        // Materials
        const serverMaterial = new THREE.MeshBasicMaterial({ color: 0x3861FB });
        const serverGlowMaterial = new THREE.MeshBasicMaterial({ color: 0x5b7fff, transparent: true, opacity: 0.3 });
        const clientMaterial = new THREE.MeshBasicMaterial({ color: 0x9333ea });
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.3 });
        
        // Server Node (Center)
        const serverGeometry = new THREE.SphereGeometry(8, 32, 32);
        const serverMesh = new THREE.Mesh(serverGeometry, serverMaterial);
        scene.add(serverMesh);
        
        // Server Glow / Pulse Halo
        const glowGeometry = new THREE.SphereGeometry(10, 32, 32);
        const glowMesh = new THREE.Mesh(glowGeometry, serverGlowMaterial);
        scene.add(glowMesh);

        // Client Nodes & Connections
        const clients: { mesh: THREE.Mesh, angle: number, radius: number, speed: number, yOffset: number }[] = [];
        const lines: THREE.Line[] = [];
        const numClients = 8;
        
        const clientGeometry = new THREE.SphereGeometry(3, 16, 16);
        
        for (let i = 0; i < numClients; i++) {
            const mesh = new THREE.Mesh(clientGeometry, clientMaterial);
            const radius = 60 + Math.random() * 40;
            const angle = (i / numClients) * Math.PI * 2 + Math.random();
            const speed = 0.002 + Math.random() * 0.003;
            const yOffset = (Math.random() - 0.5) * 40;
            
            mesh.position.set(Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius);
            scene.add(mesh);
            clients.push({ mesh, angle, radius, speed, yOffset });
            
            // Initial connecting line
            const points = [serverMesh.position, mesh.position];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            scene.add(line);
            lines.push(line);
        }

        // Particle System (Updates streaming context)
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Track which client each particle belongs to and its progress (0 to 1)
        const particleData = Array.from({ length: particleCount }).map(() => ({
            clientIndex: Math.floor(Math.random() * numClients),
            progress: Math.random() // Start at random positions
        }));
        
        for(let i=0; i < particleCount; i++) {
            particlePositions[i*3] = 0;
            particlePositions[i*3+1] = 0;
            particlePositions[i*3+2] = 0;
        }
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({ 
            color: 0x3861FB, 
            size: 2, 
            transparent: true,
            blending: THREE.AdditiveBlending 
        });
        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particleSystem);

        let pulseScale = 1;
        let isPulsing = false;
        
        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            
            // Rotate Server slowly
            serverMesh.rotation.y += 0.01;
            
            // Orbit Clients
            clients.forEach((client, index) => {
                client.angle += client.speed;
                // Add slight vertical bobbing
                const bob = Math.sin(client.angle * 2) * 10;
                client.mesh.position.set(
                    Math.cos(client.angle) * client.radius,
                    client.yOffset + bob,
                    Math.sin(client.angle) * client.radius
                );
                
                // Update Line
                const positions = lines[index].geometry.attributes.position.array as Float32Array;
                positions[3] = client.mesh.position.x;
                positions[4] = client.mesh.position.y;
                positions[5] = client.mesh.position.z;
                lines[index].geometry.attributes.position.needsUpdate = true;
            });
            
            // Update Particles
            const positions = particleSystem.geometry.attributes.position.array as Float32Array;
            for(let i=0; i < particleCount; i++) {
                const pd = particleData[i];
                pd.progress += 0.01 + Math.random() * 0.01; // Particle Speed
                
                if (pd.progress >= 1.0) {
                    // Reached server, trigger aggregation pulse
                    isPulsing = true;
                    // Reset particle
                    pd.progress = 0;
                    pd.clientIndex = Math.floor(Math.random() * numClients);
                }
                
                const clientPos = clients[pd.clientIndex].mesh.position;
                const serverPos = serverMesh.position;
                
                // Linear interpolation (client -> server)
                positions[i*3] = clientPos.x + (serverPos.x - clientPos.x) * pd.progress;
                positions[i*3+1] = clientPos.y + (serverPos.y - clientPos.y) * pd.progress;
                positions[i*3+2] = clientPos.z + (serverPos.z - clientPos.z) * pd.progress;
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
            
            // Pulse Animation Logic
            if (isPulsing) {
                pulseScale += 0.05;
                if (pulseScale > 1.5) {
                    pulseScale = 1;
                    isPulsing = false;
                }
            } else {
                pulseScale = 1 + Math.sin(Date.now() * 0.002) * 0.05; // Gentle breathing
            }
            glowMesh.scale.set(pulseScale, pulseScale, pulseScale);
            serverGlowMaterial.opacity = 0.3 * (2 - pulseScale); // Fades as it expands
            
            // Optional: slow pan of the whole scene
            scene.rotation.y = Math.sin(Date.now() * 0.0005) * 0.2;
            scene.rotation.x = Math.sin(Date.now() * 0.0003) * 0.1;

            renderer.render(scene, camera);
        };
        
        animate();
        
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            if (currentMount.contains(renderer.domElement)) currentMount.removeChild(renderer.domElement);
            renderer.dispose();
            particleGeometry.dispose();
            particleMaterial.dispose();
            serverGeometry.dispose();
            serverMaterial.dispose();
            glowGeometry.dispose();
            serverGlowMaterial.dispose();
            clientGeometry.dispose();
            clientMaterial.dispose();
            lineMaterial.dispose();
        };
    }, []);
    return <div ref={mountRef} />;
};

// --- DEFAULT DATA ---
const defaultData = {
  logo: { initials: 'AS', name: 'AsyncShield' },
  navLinks: [ { label: 'About', href: '#about' }, { label: 'Projects', href: '#projects' }, { label: 'Skills', href: '#skills' } ] as NavLink[],
  resume: { label: 'Resume', onClick: undefined as (() => void) | undefined },
  hero: { titleLine1: 'Creative Developer &', titleLine2Gradient: 'Digital Designer', subtitle: 'I craft beautiful digital experiences through code and design.', },
  ctaButtons: { primary: { label: 'View My Work', onClick: undefined as (() => void) | undefined }, secondary: { label: 'Get In Touch', onClick: undefined as (() => void) | undefined }, },
  projects: [ { title: 'FinTech Mobile App', description: 'React Native app with AI-powered financial insights.', tags: ['React Native', 'Node.js'] }, { title: 'Data Visualization Platform', description: 'Interactive dashboard for complex data analysis.', tags: ['D3.js', 'Python'] }, { title: '3D Portfolio Site', description: 'Immersive WebGL experience with 3D elements.', tags: ['Three.js', 'WebGL'] }, ] as Project[],
  stats: [ { value: '50+', label: 'Projects Completed' }, { value: '5+', label: 'Years Experience' }, { value: '15+', label: 'Happy Clients' }, ] as Stat[],
};

// --- MAIN CUSTOMIZABLE PORTFOLIO COMPONENT ---
const PortfolioPage: React.FC<PortfolioPageProps> = ({
  logo = defaultData.logo,
  navLinks = defaultData.navLinks,
  resume = defaultData.resume,
  hero = defaultData.hero,
  ctaButtons = defaultData.ctaButtons,
  projects = defaultData.projects,
  stats = defaultData.stats,
  showAnimatedBackground = true,
}) => {
  return (
    <div className="bg-transparent text-[#E2E8F0]">
      {showAnimatedBackground && <FederatedLearningBackground />}
      <div className="relative z-10">
        <main id="about" className="w-full min-h-screen flex flex-col items-center justify-center px-6 py-20">
            <div className="max-w-6xl mx-auto text-center">
                <div className="mb-8 float-animation">
                    <h1 className="md:text-6xl lg:text-7xl leading-[1.1] text-5xl font-light text-[#E2E8F0] tracking-tight mb-4">
                        {hero.titleLine1}
                        <span className="gradient-text block tracking-tight">{hero.titleLine2Gradient}</span>
                    </h1>
                    <p className="md:text-xl max-w-3xl leading-relaxed text-lg font-light text-[#64748B] mx-auto">{hero.subtitle}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                    <button onClick={ctaButtons.primary.onClick} className="primary-button px-8 py-3.5 rounded-xl font-semibold text-sm min-w-[180px]">{ctaButtons.primary.label}</button>
                    <button onClick={ctaButtons.secondary.onClick} className="glass-button min-w-[180px] text-sm font-semibold rounded-xl px-8 py-3.5">{ctaButtons.secondary.label}</button>
                </div>
                <div className="divider mb-16" />
                <div id="projects" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
                    {projects.map((project, index) => (
                        <div key={index} className="glass-card rounded-2xl p-6 text-left group">
                            <div className="project-image rounded-xl h-32 mb-4 flex items-center justify-center border border-[rgba(255,255,255,0.08)]">{project.imageContent}</div>
                            <h3 className="text-lg font-medium text-[#E2E8F0] mb-2">{project.title}</h3>
                            <p className="text-[#64748B] text-sm mb-4">{project.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {project.tags.map(tag => (
                                    <span key={tag} className="skill-badge px-2 py-1 rounded-md text-xs">{tag}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="divider mb-16" />
                <div id="skills" className="flex flex-col sm:flex-row justify-center items-center gap-8 text-center">
                    {stats.map((stat, index) => (
                        <React.Fragment key={stat.label}>
                            <div>
                                <div className="text-3xl md:text-4xl font-light text-[#E2E8F0] mb-1 tracking-tight">{stat.value}</div>
                                <div className="text-[#64748B] text-sm font-normal">{stat.label}</div>
                            </div>
                            {index < stats.length - 1 && <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.2)] to-transparent" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export {PortfolioPage};

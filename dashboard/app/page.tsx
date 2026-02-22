// app/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { PortfolioPage, PortfolioPageProps } from "@/components/ui/starfall-portfolio-landing";
import { Shield, Server, Users, Database, Activity, Lock } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const customPortfolioData: PortfolioPageProps = {
    logo: {
      initials: <Shield className="w-4 h-4" />,
      name: 'AsyncShield',
    },
    navLinks: [
      { label: 'About', href: '#about' },
      { label: 'Features', href: '#projects' },
      { label: 'Stats', href: '#skills' },
      { label: 'Cloud Compute', href: '/compute' },
    ],
    resume: {
      label: 'GitHub Repo',
      onClick: () => window.open('https://github.com/aaryankamdar2005/asyncshield', '_blank'),
    },
    hero: {
      titleLine1: 'Decentralized & Secure',
      titleLine2Gradient: 'Federated Learning',
      subtitle: 'A zero-trust platform for collaborative AI model training. Contribute to global models securely without sharing your raw data.',
    },
    ctaButtons: {
      primary: {
        label: '👨‍💻 Login as Server',
        onClick: () => router.push('/server'),
      },
      secondary: {
        label: '🛡️ Login as Client',
        onClick: () => router.push('/client'),
      },
    },
    projects: [
      { 
        title: 'Zero-Trust Aggregation', 
        description: 'Server evaluates every update for accuracy improvements and rejects poisoned or fraudulent weights.',
        tags: ['Security', 'Evaluation'],
        imageContent: <Server className="w-12 h-12 text-rose-400" />
      },
      { 
        title: 'Differential Privacy', 
        description: 'Client nodes train locally and apply differential privacy (Opacus) before submitting updates.',
        tags: ['Privacy', 'Opacus'],
        imageContent: <Lock className="w-12 h-12 text-indigo-400" />
      },
      { 
        title: 'Consensus & Bounties', 
        description: 'Contributors earn token bounties based on the actual accuracy improvement their update provides.',
        tags: ['Rewards', 'Blockchain'],
        imageContent: <Activity className="w-12 h-12 text-emerald-400" />
      },
    ],
    stats: [
      { value: '100%', label: 'Data Privacy' },
      { value: '0', label: 'Trust Required' },
      { value: '∞', label: 'Scalability' },
    ],
    showAnimatedBackground: true,
  };

  return <PortfolioPage {...customPortfolioData} />;
}
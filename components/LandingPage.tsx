import React from 'react';
import { Shield, Zap, Lock, FileText, Activity, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: <Shield className="w-8 h-8 text-[#004d4a]" />,
      title: "BITE v2 Encrypted",
      description: "Advanced encryption ensures your renewal policies remain private and secure"
    },
    {
      icon: <Zap className="w-8 h-8 text-[#004d4a]" />,
      title: "Automated Execution",
      description: "Smart agents automatically execute renewals based on your conditions"
    },
    {
      icon: <Lock className="w-8 h-8 text-[#004d4a]" />,
      title: "Private Conditional Execution",
      description: "Your conditions are evaluated privately without exposing sensitive data"
    },
    {
      icon: <FileText className="w-8 h-8 text-[#004d4a]" />,
      title: "Complete Audit Trail",
      description: "Full transparency with detailed receipts for every agent action"
    },
    {
      icon: <Activity className="w-8 h-8 text-[#004d4a]" />,
      title: "Real-time Monitoring",
      description: "Monitor agent status and execution results in real-time"
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-[#004d4a]" />,
      title: "Guardrail Protection",
      description: "Built-in guardrails prevent unauthorized or excessive renewals"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f8] to-[#e6f4f3]">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="mb-6">
            <img 
              src="/assets/Akomi.png" 
              alt="Akomi Logo" 
              className="w-20 h-20 object-contain mb-4"
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-[#004d4a]">Akomi</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The next-generation platform for automated subscription renewals with advanced encryption, 
            private conditional execution, and complete audit transparency.
          </p>
          <button 
            onClick={onGetStarted}
            className="bg-[#004d4a] hover:bg-[#003d3a] text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
          >
            Get Started
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Automate Your Renewals?
          </h2>
          <p className="text-gray-600 mb-6">
            Join the future of subscription management with Akomi's encrypted, automated renewal system.
          </p>
          <button 
            onClick={onGetStarted}
            className="bg-[#004d4a] hover:bg-[#003d3a] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Create Your First Agent
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
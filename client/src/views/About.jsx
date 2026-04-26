import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Heart } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ padding: '40px', color: 'var(--text-main)' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--glass-border)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '12px',
          cursor: 'pointer',
          marginBottom: '40px',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
        onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '48px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', fontWeight: '800', background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          About LibSys
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '48px', lineHeight: '1.6' }}>
          my personal media ecosystem. IF youre admin you can manage books, movies, games, and more in one unified interface. contant me if youre really into adding stuff to collections n shi. other than that feel free to add stuff to your own wishlist. (as long as youre logged in, and dont spam logins imma ban yall)
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <a 
            href="https://sabret.onrender.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="glass-card"
            style={{ 
              padding: '32px', 
              textDecoration: 'none', 
              color: 'inherit',
              transition: 'transform 0.3s ease, border-color 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              border: '1px solid var(--glass-border)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--glass-border)';
            }}
          >
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '16px', borderRadius: '50%' }}>
              <Globe size={32} color="#6366f1" />
            </div>
            <h3 style={{ margin: 0 }}>Portfolio</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Visit my website</p>
          </a>

          <a 
            href="https://github.com/sabret-coomar/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="glass-card"
            style={{ 
              padding: '32px', 
              textDecoration: 'none', 
              color: 'inherit',
              transition: 'transform 0.3s ease, border-color 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              border: '1px solid var(--glass-border)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = '#2ea44f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--glass-border)';
            }}
          >
            <div style={{ background: 'rgba(46, 164, 79, 0.1)', padding: '16px', borderRadius: '50%' }}>
              <Globe size={32} color="#2ea44f" />
            </div>
            <h3 style={{ margin: 0 }}>GitHub</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Check out my code</p>
          </a>

          <div 
            className="glass-card"
            style={{ 
              padding: '32px', 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              border: '1px solid var(--glass-border)',
              opacity: 0.8
            }}
          >
            <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '16px', borderRadius: '50%' }}>
              <Heart size={32} color="#ec4899" />
            </div>
            <h3 style={{ margin: 0 }}>Donate</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Support the project</p>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#ec4899' }}>Coming Soon</span>
          </div>
        </div>

        <div style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} LibSys. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default About;

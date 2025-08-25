'use client';

import React, { useState, useEffect } from 'react';
import { GuidesList, LabsList } from '@/components';
import OnboardingTooltips from '@/components/OnboardingTooltips';
import { useOnboarding, onboardingUtils } from '@/lib/onboarding';
import { tokens } from '@/styles/tokens';
import { Guide, Lab } from '@/types';

interface HomeClientProps {
  guides: Guide[];
  labs: Lab[];
}

export default function HomeClient({ guides, labs }: HomeClientProps) {
  const [showTooltips, setShowTooltips] = useState(false);
  
  const {
    isFirstTimeUser,
    shouldShowOnboarding,
    preferredStartGuide,
    completeOnboarding,
  } = useOnboarding();

  useEffect(() => {
    // Show tooltips after a brief delay to let the page render
    if (onboardingUtils.shouldShowTooltips()) {
      const timer = setTimeout(() => {
        setShowTooltips(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartLearning = () => {
    completeOnboarding();
    // Navigate to the preferred first guide
    window.location.href = `/guides/${preferredStartGuide}`;
  };

  const handleTooltipsComplete = () => {
    setShowTooltips(false);
  };

  const handleTooltipsDismiss = () => {
    setShowTooltips(false);
  };

  // Get the recommended first guide
  const firstGuide = guides.find(guide => guide.id === preferredStartGuide) || guides[0];

  return (
    <div className="home-container">
      <header className="home-header fade-in">
        <h1 className="home-title">Prompt Practice App</h1>
        <p className="home-subtitle">
          Learn prompt engineering through interactive guides and hands-on practice labs.
        </p>
        
        {/* Learning Flow Introduction for First-Time Users */}
        {shouldShowOnboarding && (
          <div 
            className="onboarding-intro fade-in"
            style={{
              marginTop: tokens.spacing[6],
              padding: tokens.spacing[6],
              backgroundColor: tokens.colors.primary[50],
              border: `1px solid ${tokens.colors.primary[200]}`,
              borderRadius: tokens.borderRadius.lg,
              textAlign: 'center',
              animationDelay: '0.1s',
            }}
          >
            <h2 
              style={{
                margin: 0,
                marginBottom: tokens.spacing[3],
                fontSize: tokens.typography.fontSize.xl,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: tokens.colors.primary[800],
              }}
            >
              Welcome to Your Learning Journey! 🚀
            </h2>
            <p 
              style={{
                margin: 0,
                marginBottom: tokens.spacing[4],
                fontSize: tokens.typography.fontSize.base,
                color: tokens.colors.primary[700],
                lineHeight: tokens.typography.lineHeight.relaxed,
              }}
            >
              Follow our simple 3-step process: <strong>Learn</strong> concepts through guides, 
              <strong> Practice</strong> with interactive labs, and track your <strong>Progress</strong> as you improve.
            </p>
            <button
              onClick={handleStartLearning}
              style={{
                padding: `${tokens.spacing[3]} ${tokens.spacing[6]}`,
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: tokens.colors.text.inverse,
                backgroundColor: tokens.colors.primary[600],
                border: 'none',
                borderRadius: tokens.borderRadius.md,
                cursor: 'pointer',
                transition: `all ${tokens.animation.duration.fast} ${tokens.animation.easing.out}`,
                boxShadow: tokens.boxShadow.sm,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = tokens.colors.primary[700];
                e.currentTarget.style.boxShadow = tokens.boxShadow.md;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = tokens.colors.primary[600];
                e.currentTarget.style.boxShadow = tokens.boxShadow.sm;
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.colors.primary[300]}`;
                e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              Start Here: {firstGuide?.title || 'Begin Learning'} →
            </button>
          </div>
        )}

        <div className="home-stats" aria-label="App statistics">
          <div className="stat-item">
            <span className="stat-number">{guides.length}</span>
            <span className="stat-label">Learning Guides</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{labs.filter(lab => !lab.isPlaceholder).length}</span>
            <span className="stat-label">Practice Labs</span>
          </div>
        </div>
      </header>

      <main className="home-content">
        <div className="guides-section fade-in" style={{ animationDelay: '0.2s' }}>
          {shouldShowOnboarding && (
            <div 
              className="start-here-indicator"
              style={{
                position: 'relative',
                marginBottom: tokens.spacing[4],
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: tokens.spacing[2],
                  padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                  backgroundColor: tokens.colors.success[100],
                  color: tokens.colors.success[800],
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.medium,
                  borderRadius: tokens.borderRadius.full,
                  border: `1px solid ${tokens.colors.success[300]}`,
                }}
              >
                <span style={{ fontSize: '16px' }}>👋</span>
                Start Here - Begin with Fundamentals
              </div>
            </div>
          )}
          <GuidesList guides={guides} />
        </div>
        <div className="labs-section fade-in" style={{ animationDelay: '0.4s' }}>
          <LabsList labs={labs} />
        </div>
      </main>

      {/* Onboarding Tooltips */}
      {showTooltips && (
        <OnboardingTooltips
          onComplete={handleTooltipsComplete}
          onDismiss={handleTooltipsDismiss}
        />
      )}
    </div>
  );
}
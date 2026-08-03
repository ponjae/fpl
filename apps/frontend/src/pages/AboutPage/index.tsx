import React from 'react';
import Page, { PageHeader } from '../../components/Page';
import PageSection from '../../components/PageSection';
import Text from '../../components/Text';
import './index.scss';

const AboutPage: React.FC = () => {
  return (
    <Page
      header={
        <PageHeader
          title="About the Project"
          caption="Data-driven decisions meeting the beautiful game."
        />
      }
      padded
    >
      <div className="about-page">
        <div className="about-grid">
          {/* Left Column: About the App */}
          <div className="about-column app-section">
            <PageSection title="About this App">
              <div className="app-card">
                <div className="app-card__header">
                  <span className="app-card__badge success">THE GENESIS</span>
                  <Text tagName="h3" variant="primary" className="app-card__title">
                    Combining Passion & Code
                  </Text>
                </div>
                <Text tagName="p" variant="secondary" className="app-card__text">
                  As a side project during my master's thesis I wanted to learn Python and combine it with football. The result was a Flask app giving FPL suggestions. Football has been my greatest interest for as long as I can remember.
                </Text>
                <Text tagName="p" variant="secondary" className="app-card__text">
                  During university I discovered Fantasy Premier League — how much fun it was, and how it helped me enjoy football even more. My best friend from university also loves football (even though he supports Spurs...) and since the 2018/19 season we've been competing against each other in the "coffee of the week" H2H league and in the Port-a-Fort league.
                </Text>
              </div>

              <div className="app-card">
                <div className="app-card__header">
                  <span className="app-card__badge warning">THE EVOLUTION</span>
                  <Text tagName="h3" variant="primary" className="app-card__title">
                    Botlas: The Data-Only Manager
                  </Text>
                </div>
                <Text tagName="p" variant="secondary" className="app-card__text">
                  As our CS knowledge grew, so did our interest in using data to improve our FPL game. We invented <strong>Botlas</strong>, a team using only actual data. It worked quite well — but both of us managed to beat it, probably because we're such great managers ourselves...
                </Text>
                <Text tagName="p" variant="secondary" className="app-card__text">
                  This year I wanted to take the idea to the next level. I wanted to present the "best" team based on data within a given budget. I know it's not perfect and can definitely be improved, but it gives useful inspiration about your team.
                </Text>
              </div>

              <div className="app-card">
                <div className="app-card__header">
                  <span className="app-card__badge brand">VERSION 2.0</span>
                  <Text tagName="h3" variant="primary" className="app-card__title">
                    Rebuilt on Node and React
                  </Text>
                </div>
                <Text tagName="p" variant="secondary" className="app-card__text">
                  Now, with more experience and after building and hosting another SPA for my girlfriend's company (
                  <a href="https://www.videografonbudget.se/" target="_blank" rel="noopener noreferrer" className="highlight-link">
                    videografonbudget.se
                  </a>
                  ), I wanted to challenge myself to build a 2.0 version using Node, React, and a real backend + frontend.
                </Text>
              </div>
            </PageSection>
          </div>

          {/* Right Column: About the Creator */}
          <div className="about-column creator-section">
            <PageSection title="About Me">
              <div className="profile-card">
                <div className="profile-header">
                  <div className="profile-avatar">
                    <span>PJ</span>
                  </div>
                  <div className="profile-info">
                    <Text tagName="h3" variant="primary" className="profile-name">
                      Pontus Jaensson
                    </Text>
                    <Text tagName="span" variant="tertiary" className="profile-title">
                      Software Engineer @ IKEA
                    </Text>
                  </div>
                </div>

                <div className="profile-bio">
                  <Text tagName="p" variant="secondary">
                    Experienced software engineer with a strong track record of delivering end-to-end solutions in cross-functional teams. Skilled in both technical implementation and stakeholder management. Adept at leading discussions, facilitating decision-making, and shaping architectural and product strategy.
                  </Text>
                </div>

                <div className="profile-links">
                  <a
                    href="https://www.linkedin.com/in/pontus-jaensson48b1811a1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn linkedin"
                  >
                    <svg viewBox="0 0 24 24" className="social-icon">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    <span>LinkedIn</span>
                  </a>

                  <a
                    href="https://github.com/ponjae"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn github"
                  >
                    <svg viewBox="0 0 24 24" className="social-icon">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span>GitHub</span>
                  </a>

                  <a
                    href="https://github.com/POJAE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn github secondary-btn"
                  >
                    <svg viewBox="0 0 24 24" className="social-icon">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span>GitHub (Work)</span>
                  </a>
                </div>
              </div>

              {/* Education section */}
              <div className="resume-section">
                <div className="resume-section__title">
                  <Text tagName="h4" variant="primary">Education</Text>
                </div>
                <div className="resume-item">
                  <div className="resume-item__header">
                    <Text tagName="h5" variant="primary" className="resume-item__role">
                      M.Sc. in Computer Science and Engineering
                    </Text>
                    <span className="resume-item__duration">2017 – 2022</span>
                  </div>
                  <Text tagName="p" variant="secondary" className="resume-item__org">
                    Faculty of Engineering, Lund University (LTH)
                  </Text>
                </div>
              </div>

              {/* Work section */}
              <div className="resume-section">
                <div className="resume-section__title">
                  <Text tagName="h4" variant="primary">Work Experience</Text>
                </div>
                <div className="resume-item">
                  <div className="resume-item__header">
                    <Text tagName="h5" variant="primary" className="resume-item__role">
                      Software Engineer
                    </Text>
                    <span className="resume-item__duration">2022 – Present</span>
                  </div>
                  <Text tagName="p" variant="secondary" className="resume-item__org">
                    IKEA
                  </Text>
                </div>
              </div>

              {/* Technologies section */}
              <div className="tech-section">
                <Text tagName="h4" variant="primary" className="tech-title">
                  Technologies
                </Text>
                <div className="tech-tags">
                  {['Node', 'React', 'TypeScript', 'Python', 'Terraform', 'GCP', 'Rust', 'Agile'].map((tech) => (
                    <span key={tech} className="tech-tag">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Extra Projects links */}
              <div className="extra-projects-card">
                <Text tagName="h4" variant="primary" className="extra-title">
                  Other Projects
                </Text>
                <div className="projects-list">
                  <a href="https://www.videografonbudget.se/" target="_blank" rel="noopener noreferrer" className="project-link-item">
                    <div className="project-link-info">
                      <span className="project-link-title">videografonbudget.se</span>
                      <span className="project-link-desc">Single-page application built and hosted for my girlfriend's company</span>
                    </div>
                    <span className="project-arrow">→</span>
                  </a>
                  <a href="https://github.com/ponjae/FPL-project" target="_blank" rel="noopener noreferrer" className="project-link-item">
                    <div className="project-link-info">
                      <span className="project-link-title">Original FPL Project</span>
                      <span className="project-link-desc">Flask Python web app providing data-driven FPL team suggestions</span>
                    </div>
                    <span className="project-arrow">→</span>
                  </a>
                </div>
              </div>
            </PageSection>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default AboutPage;

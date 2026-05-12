import React from 'react';

/**
 * GlobalErrorBoundary - A premium, top-level safety net for the application.
 * Catch-all for initialization errors or provider-level crashes.
 */
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global Application Crash Captured:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHardReset = () => {
    if (window.confirm("ئایا تۆ پشتڕاستی کو دەتەوێت ھەموو داتاکان بسڕیتەوە؟ (ئەڤە دێ ھەمی ئاست و XPێن تە ژناڤ ببەت)")) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          backgroundColor: '#0f172a',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '20px',
          fontFamily: 'sans-serif'
        }}>
          {/* High-fidelity Error UI */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '60px 40px',
            borderRadius: '40px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            maxWidth: '500px'
          }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>⚠️</div>
            
            <h1 style={{ fontWeight: '900', fontSize: '32px', marginBottom: '15px' }}>ئاریشەیەک چێ بوو!</h1>
            <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: '1.6', marginBottom: '40px' }}>
              ببورە، ھندەک ئاریشەیێن تەکنیکی د دەستپێکرنا یاریێ دا ھەبوون. <br/>
              هێڤییە پێکۆلێ بکە و پەیجێ نوو بکە.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                onClick={this.handleReload}
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontWeight: '900',
                  fontSize: '18px',
                  cursor: 'pointer',
                  boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)'
                }}
              >
                نووکرنا پەیجێ 🔄
              </button>
              
              <button 
                onClick={this.handleHardReset}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                پاککرنا داتایان و دەستپێکردنەوە (Reset)
              </button>
            </div>
            
            {window.location.hostname === 'localhost' && (
              <pre style={{ 
                marginTop: '30px', 
                padding: '15px', 
                fontSize: '10px', 
                backgroundColor: 'rgba(0,0,0,0.3)', 
                borderRadius: '10px', 
                color: '#ef4444',
                textAlign: 'left',
                overflowX: 'auto',
                maxWidth: '100%'
              }}>
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;

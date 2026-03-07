import React from 'react';

export class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("GlobalErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', fontFamily: 'monospace', color: '#ff4444', backgroundColor: '#fff0f0', minHeight: '100vh', border: '5px solid #ff4444' }}>
                    <h2>🚨 FATAL REACT CRASH 🚨</h2>
                    <div style={{ background: '#222', color: '#fff', padding: '20px', borderRadius: '8px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                        <p style={{ color: '#ff8888', fontWeight: 'bold', fontSize: '1.2em' }}>{this.state.error && this.state.error.toString()}</p>
                        <br />
                        <details style={{ marginTop: '10px' }} open>
                            <summary>Component Stack Trace</summary>
                            <p style={{ color: '#aaa', marginTop: '10px' }}>{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
                        </details>
                    </div>
                    <p style={{ marginTop: '20px', color: '#666' }}>Please copy paste this exact error block so we can fix the white screen instantly.</p>
                </div>
            );
        }

        return this.props.children;
    }
}

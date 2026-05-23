import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "#0f0b07",
          color: "#f0e6d3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px"
        }}>
          <div style={{
            maxWidth: "420px",
            width: "100%",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(200,137,58,0.2)",
            borderRadius: "18px",
            padding: "32px",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "42px",
              marginBottom: "12px"
            }}>
              ☕
            </div>

            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              marginBottom: "12px"
            }}>
              Something went wrong
            </h2>

            <p style={{
              color: "#9a7a5a",
              fontSize: "14px",
              lineHeight: 1.7,
              marginBottom: "22px"
            }}>
              The app encountered an unexpected error.
              Your data is safe.
            </p>

            <button
              onClick={this.handleRefresh}
              style={{
                background: "linear-gradient(135deg,#c8893a,#a06828)",
                border: "none",
                borderRadius: "10px",
                padding: "12px 18px",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              Reload App
            </button>

            {this.state.error && (
              <div style={{
                marginTop: "20px",
                fontSize: "11px",
                color: "#7a6050",
                wordBreak: "break-word"
              }}>
                {this.state.error.toString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

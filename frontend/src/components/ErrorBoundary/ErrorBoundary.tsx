import { Component } from "react";

interface Props { children: React.ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Algo salió mal</h2>
          <p style={{ color: "#888", marginTop: 8 }}>{this.state.error?.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{ marginTop: 12, padding: "8px 20px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

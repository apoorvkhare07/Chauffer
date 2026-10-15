import React, { Component, type PropsWithChildren } from "react";
import { Button, Empty, Screen } from "./ui";
export class ErrorBoundary extends Component<
  PropsWithChildren,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Screen>
        <Empty
          title="This screen could not load"
          text="Check your connection, then reload this screen. Saved data stays on your account."
        >
          <Button
            label="Reload screen"
            onPress={() => this.setState({ failed: false })}
          />
        </Empty>
      </Screen>
    ) : (
      this.props.children
    );
  }
}

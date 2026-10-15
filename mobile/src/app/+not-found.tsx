import { router } from "expo-router";
import { Button, Empty, Screen } from "../components/ui";
export default function NotFound() {
  return (
    <Screen>
      <Empty
        title="This page is not here"
        text="Head back to your shopping assistant."
      >
        <Button label="Go to Discover" onPress={() => router.replace("/")} />
      </Empty>
    </Screen>
  );
}

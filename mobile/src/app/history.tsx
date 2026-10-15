import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PrivateScreen, ConnectionNotice } from "../providers/Backend";
import {
  Button,
  Card,
  Copy,
  Empty,
  Loading,
  Muted,
  Screen,
  Title,
} from "../components/ui";
export default function History() {
  return (
    <PrivateScreen title="Past chats">
      <PastChats />
    </PrivateScreen>
  );
}
function PastChats() {
  const [session, setSession] = useState<number>();
  const history = useQuery(
    api.conversations.history,
    session === undefined ? {} : { session },
  );
  return (
    <Screen>
      <Title>Your past chats.</Title>
      <Muted>
        Recent history is read-only. Previous styling suggestions may be out of
        date.
      </Muted>
      <ConnectionNotice />
      {!history ? (
        <Loading label="Loading recent chats…" />
      ) : !history.sessions.length ? (
        <Empty
          title="No past chats yet"
          text="Starting a new search moves your current chat here."
        />
      ) : (
        history.sessions.map((row) => (
          <Button
            secondary
            key={row.session}
            label={`${new Date(row.createdAt).toLocaleDateString("en-IN")} · ${row.preview}`}
            onPress={() => setSession(row.session)}
          />
        ))
      )}
      {history?.messages.map((message) => (
        <Card key={message.id}>
          <Muted>{message.role === "user" ? "You" : "Chauffer"}</Muted>
          <Copy>{message.text}</Copy>
          {!!message.result?.options.length && (
            <Muted>
              {message.result.options.length} historical products. Return to
              Discover for current options.
            </Muted>
          )}
        </Card>
      ))}
    </Screen>
  );
}

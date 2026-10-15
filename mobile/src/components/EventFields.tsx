import type { StyleEvent } from "../core/event";
import { Chip, Field, Muted, Row } from "./ui";
export function EventFields({
  event,
  onChange,
  disabled = false,
}: {
  event: StyleEvent;
  onChange: (value: StyleEvent) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <Field
        label="Date (YYYY-MM-DD)"
        value={event.date}
        onChangeText={(date) => onChange({ ...event, date })}
        maxLength={10}
        editable={!disabled}
      />
      <Muted>Time zone: {event.timeZone}</Muted>
      <Row>
        {(["auto", "morning", "afternoon", "evening", "night"] as const).map(
          (period) => (
            <Chip
              key={period}
              label={period === "auto" ? "Current time" : period}
              selected={event.period === period}
              disabled={disabled}
              onPress={() => onChange({ ...event, period })}
            />
          ),
        )}
      </Row>
      <Row>
        {(["unspecified", "indoors", "outdoors", "mixed"] as const).map(
          (setting) => (
            <Chip
              key={setting}
              label={
                setting === "unspecified"
                  ? "Any setting"
                  : setting === "mixed"
                    ? "Both / commuting"
                    : setting
              }
              selected={event.setting === setting}
              disabled={disabled}
              onPress={() => onChange({ ...event, setting })}
            />
          ),
        )}
      </Row>
      <Muted>
        No location permission is requested. Describe weather or a dress code in
        your question when relevant.
      </Muted>
    </>
  );
}

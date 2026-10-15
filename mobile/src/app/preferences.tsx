import { useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { api } from "../../../convex/_generated/api";
import {
  useBackend,
  ConfigNotice,
  ConnectionNotice,
} from "../providers/Backend";
import {
  Button,
  Card,
  Chip,
  Copy,
  Field,
  Heading,
  Loading,
  Muted,
  Notice,
  Row,
  Screen,
  Title,
} from "../components/ui";
import type { Preferences, Style } from "../core/contracts";
import { useTask } from "../hooks/useTask";
export default function PreferencesScreen() {
  const { connected } = useBackend();
  return connected ? (
    <LoadPreferences />
  ) : (
    <Screen>
      <ConfigNotice />
    </Screen>
  );
}
function LoadPreferences() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const preferences = useQuery(api.profiles.get, isAuthenticated ? {} : "skip"),
    style = useQuery(api.wardrobeMetadata.style, isAuthenticated ? {} : "skip");
  if (isLoading)
    return (
      <Screen>
        <Loading label="Restoring your account…" />
        <ConnectionNotice />
      </Screen>
    );
  if (!isAuthenticated)
    return (
      <Screen>
        <Button
          label="Continue with phone"
          onPress={() => router.push("/sign-in")}
        />
      </Screen>
    );
  if (preferences === undefined || !style)
    return (
      <Screen>
        <Loading label="Loading your preferences…" />
        <ConnectionNotice />
      </Screen>
    );
  return <PreferenceForm initial={preferences} initialStyle={style} />;
}
function PreferenceForm({
  initial,
  initialStyle,
}: {
  initial: Preferences | null;
  initialStyle: Style;
}) {
  const save = useMutation(api.styling.saveSetup),
    mark = useMutation(api.styling.markOnboarding),
    task = useTask();
  const [name, setName] = useState(initial?.name || ""),
    [age, setAge] = useState(initial?.age?.toString() || ""),
    [gender, setGender] = useState<Preferences["gender"]>(initial?.gender);
  const [audience, setAudience] = useState<Preferences["audience"]>(
      initial?.audience,
    ),
    [language, setLanguage] = useState<Preferences["language"]>(
      initial?.language || "en",
    );
  const [size, setSize] = useState(initial?.size || ""),
    [jeans, setJeans] = useState(initial?.jeansSize || ""),
    [height, setHeight] = useState(initial?.heightCm?.toString() || ""),
    [budget, setBudget] = useState(
      initial?.budgetPaise ? String(initial.budgetPaise / 100) : "",
    );
  const [style, setStyle] = useState(initialStyle),
    [saved, setSaved] = useState(false);
  return (
    <Screen>
      <Title>Your style. Your say.</Title>
      <Copy>
        A few basics help us get started. Photos, body details, sizes and budget
        are optional.
      </Copy>
      <ConnectionNotice />
      <Card>
        <Heading>Start here</Heading>
        <Field
          label="Name"
          value={name}
          onChangeText={setName}
          maxLength={60}
          autoComplete="given-name"
        />
        <Field
          label="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          maxLength={3}
        />
        <Copy>Gender</Copy>
        <Row>
          {(
            [
              ["male", "Man"],
              ["female", "Woman"],
              ["nonbinary", "Non-binary"],
              ["undisclosed", "Prefer not to say"],
            ] as const
          ).map(([value, label]) => (
            <Chip
              key={value}
              label={label}
              selected={gender === value}
              onPress={() => setGender(value)}
            />
          ))}
        </Row>
        <Field
          label="Styles you enjoy"
          value={style.stylePreferences}
          onChangeText={(stylePreferences) =>
            setStyle({ ...style, stylePreferences })
          }
          placeholder="Casual, minimal, colourful, classic…"
          maxLength={300}
        />
      </Card>
      <Card>
        <Heading>Useful defaults, if you want</Heading>
        <Muted>Each shopping request can override these.</Muted>
        <Copy>Shopping for</Copy>
        <Row>
          {(
            [
              ["men", "Menswear"],
              ["women", "Womenswear"],
              ["unisex", "Unisex"],
            ] as const
          ).map(([value, label]) => (
            <Chip
              key={value}
              label={label}
              selected={audience === value}
              onPress={() => setAudience(value)}
            />
          ))}
          <Chip
            label="Ask in chat"
            selected={!audience}
            onPress={() => setAudience(undefined)}
          />
        </Row>
        <Copy>Reply language</Copy>
        <Row>
          {(
            [
              ["en", "English"],
              ["hi", "हिन्दी"],
              ["hinglish", "Hinglish"],
            ] as const
          ).map(([value, label]) => (
            <Chip
              key={value}
              label={label}
              selected={language === value}
              onPress={() => setLanguage(value)}
            />
          ))}
        </Row>
        <Copy>Top size</Copy>
        <Row>
          {["XS", "S", "M", "L", "XL", "XXL", "XXXL", ""].map((value) => (
            <Chip
              key={value}
              label={value || "Not set"}
              selected={size === value}
              onPress={() => setSize(value)}
            />
          ))}
        </Row>
        <Field
          label="Jeans size"
          value={jeans}
          onChangeText={setJeans}
          maxLength={40}
          placeholder="Waist 32 inches"
        />
        <Field
          label="Approximate height in cm"
          value={height}
          onChangeText={setHeight}
          keyboardType="decimal-pad"
          maxLength={5}
        />
        <Field
          label="Usual maximum budget in rupees"
          value={budget}
          onChangeText={setBudget}
          keyboardType="decimal-pad"
          maxLength={8}
        />
        <Field
          label="Fit preferences"
          value={style.fitPreferences}
          onChangeText={(fitPreferences) =>
            setStyle({ ...style, fitPreferences })
          }
          maxLength={300}
        />
        <Field
          label="What should we avoid?"
          value={style.avoid}
          onChangeText={(avoid) => setStyle({ ...style, avoid })}
          maxLength={300}
        />
      </Card>
      <Button
        label="Save preferences"
        busy={task.busy}
        disabled={
          !name.trim() || !age || !gender || !style.stylePreferences.trim()
        }
        onPress={() =>
          void task.run(
            async () => {
              const ageNumber = Number(age),
                heightNumber = height ? Number(height) : undefined,
                budgetNumber = budget ? Number(budget) : undefined;
              if (
                !Number.isInteger(ageNumber) ||
                ageNumber < 13 ||
                ageNumber > 120
              )
                throw new Error("Enter an age from 13 to 120.");
              if (
                heightNumber !== undefined &&
                (!Number.isFinite(heightNumber) ||
                  heightNumber < 80 ||
                  heightNumber > 250)
              )
                throw new Error(
                  "Enter a height from 80 to 250 cm, or leave it blank.",
                );
              if (
                budgetNumber !== undefined &&
                (!Number.isFinite(budgetNumber) ||
                  budgetNumber < 100 ||
                  budgetNumber > 50000)
              )
                throw new Error(
                  "Use a budget from ₹100 to ₹50,000, or leave it blank.",
                );
              const preferences: Preferences = {
                name: name.trim(),
                age: ageNumber,
                gender,
                language,
                ...(audience ? { audience } : {}),
                ...(size ? { size } : {}),
                ...(jeans.trim() ? { jeansSize: jeans.trim() } : {}),
                ...(heightNumber !== undefined
                  ? { heightCm: heightNumber }
                  : {}),
                ...(budgetNumber !== undefined
                  ? { budgetPaise: Math.round(budgetNumber * 100) }
                  : {}),
              };
              await save({ preferences, style });
              await mark({ state: "skipped" });
            },
            () => setSaved(true),
          )
        }
      />
      {saved && (
        <Notice>
          Preferences saved. Photos and wardrobe setup have been skipped; you
          can add them later.
        </Notice>
      )}
      {!!task.error && <Notice error>{task.error}</Notice>}
      <Button
        secondary
        label="Go to Discover"
        onPress={() => router.replace("/")}
      />
      <BodyPreferences initial={initialStyle} />
    </Screen>
  );
}
function BodyPreferences({ initial }: { initial: Style }) {
  const current = useQuery(api.wardrobeMetadata.style, {}),
    save = useMutation(api.wardrobeMetadata.saveStyle),
    task = useTask();
  const [description, setDescription] = useState(initial.bodyDescription),
    [saved, setSaved] = useState(false);
  return (
    <Card>
      <Heading>Optional body context</Heading>
      <Button
        secondary
        label="Review an optional styling photo"
        onPress={() => router.push("/styling-photo")}
      />
      <Muted>
        Describe only what you want considered. No photo is required, and this
        is not a measurement or a fit guarantee. Saving here can replace a
        previous photo description.
      </Muted>
      <Field
        label="Your own description"
        value={description}
        onChangeText={(value) => {
          setDescription(value);
          setSaved(false);
        }}
        maxLength={300}
        multiline
      />
      <Button
        secondary
        label={description.trim() ? "Save body context" : "Clear body context"}
        busy={task.busy}
        disabled={!current}
        onPress={() =>
          void task.run(
            () =>
              save({
                details: { ...current!, bodyDescription: description.trim() },
              }),
            () => setSaved(true),
          )
        }
      />
      {saved && (
        <Notice>
          {description.trim()
            ? "Your description was saved."
            : "Body context cleared."}
        </Notice>
      )}
      {!!task.error && <Notice error>{task.error}</Notice>}
    </Card>
  );
}

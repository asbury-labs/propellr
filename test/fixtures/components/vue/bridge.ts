// Opt-in fixture bridge for propellr-bridge/1 using only public Vue APIs. Ownership follows
// the component tree (provide/inject and useId), never DOM ancestry. Apps that do not
// install the plugin render no markers.
import { computed, inject, provide, useId } from "vue";
import type { App, ComputedRef, InjectionKey } from "vue";

export interface BuildIdentity {
  readonly application: string;
  readonly build: string;
}
interface Declared {
  readonly variant?: string | undefined;
  readonly callsite?: string | undefined;
  readonly record?: string | undefined;
}
const buildKey: InjectionKey<BuildIdentity> = Symbol("propellr-build");
const parentKey: InjectionKey<string> = Symbol("propellr-parent");

export const propellrBridge = {
  install(app: App, build: BuildIdentity): void {
    // Instance tokens are per app; a distinct prefix keeps two apps in one document apart.
    app.config.idPrefix = build.application;
    app.provide(buildKey, build);
  },
};

export function useComponentIdentity(
  definition: string,
  declared: () => Declared = () => ({}),
): {
  readonly root: ComputedRef<Readonly<Record<string, string>>>;
  readonly part: (key: string) => Readonly<Record<string, string>>;
} {
  const build = inject(buildKey, undefined);
  const parent = inject(parentKey, undefined);
  const instance = useId();
  provide(parentKey, instance);
  const optional = (name: string, value: string | undefined) =>
    value === undefined ? {} : { [`data-propellr-${name}`]: value };
  const root = computed(() => {
    if (!build) return {};
    const { variant, callsite, record } = declared();
    return {
      "data-propellr-app": build.application,
      "data-propellr-build": build.build,
      "data-propellr-definition": definition,
      "data-propellr-instance": instance,
      ...optional("parent", parent),
      ...optional("variant", variant),
      ...optional("callsite", callsite),
      ...optional("record", record),
    };
  });
  const part = (key: string) =>
    build ? { "data-propellr-part": key, "data-propellr-owner": instance } : {};
  return { root, part };
}

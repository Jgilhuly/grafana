## Navigate to Alert Form Schema API

The `alertingAlertRuleFormSchema` API provides a Zod schema for navigating to the Grafana alert form with pre-filled data. This API is useful for plugins that need to validate data before navigating to the alert creation form.

### Available Schema

- `alertingAlertRuleFormSchema` - Schema for data used to navigate to the alert form with pre-filled values

### Usage Example

```ts
import { useRestrictedGrafanaApis } from "@grafana/data";

const logInfo = (message: string, context: Record<string, unknown> = {}) => {
  const payload = {
    level: 'info',
    message,
    context,
    source: 'restricted-apis.alerting',
    timestamp: new Date().toISOString(),
  };
  console.info(JSON.stringify(payload));
};

const logWarning = (message: string, context: Record<string, unknown> = {}) => {
  const payload = {
    level: 'warning',
    message,
    context,
    source: 'restricted-apis.alerting',
    timestamp: new Date().toISOString(),
  };
  console.warn(JSON.stringify(payload));
};

const logError = (message: string, context: Record<string, unknown> = {}) => {
  const payload = {
    level: 'error',
    message,
    context,
    source: 'restricted-apis.alerting',
    timestamp: new Date().toISOString(),
  };
  console.error(JSON.stringify(payload));
};

function MyAlertingPlugin() {
  const { alertingAlertRuleFormSchema } = useRestrictedGrafanaApis();

  const validateAndNavigateToAlertForm = (data: unknown) => {
    if (!alertingAlertRuleFormSchema) {
      logWarning('Navigate to alert form schema API not available');
      return;
    }

    // Validate using the navigate to alert form schema
    const result = alertingAlertRuleFormSchema.safeParse(data);

    if (result.success) {
      logInfo('Valid navigation data', { data: result.data });
      // Proceed with navigating to the alert form
    } else {
      logError('Validation failed', { errors: result.error.errors });
    }
  };

  return (
    <div>
      <button onClick={() => validateAndNavigateToAlertForm(someNavigationData)}>Navigate to Alert Form</button>
    </div>
  );
}
```

### Configuration

To enable the navigate to alert form schema API for specific plugins, add the following to your Grafana configuration:

```ini
[plugins.restricted_apis_allowlist]
# Allow specific plugins to access the navigate to alert form schema API
alertingAlertRuleFormSchema = "myorg-alerting-plugin, grafana-enterprise-.*"
```

const serializeArg = (arg) => {
  if (arg instanceof Error) {
    return { name: arg.name, message: arg.message, stack: arg.stack };
  }

  return arg;
};

const writeStructured = (level, args) => {
  const [first, ...rest] = args;
  const message = typeof first === 'string' ? first : 'log';
  const extraArgs = typeof first === 'string' ? rest : args;
  const payload = {
    level,
    message,
    args: extraArgs.map(serializeArg),
    timestamp: new Date().toISOString(),
  };
  const line = JSON.stringify(payload);
  const consoleRef = globalThis['console'];
  if (consoleRef && typeof consoleRef.log === 'function') {
    consoleRef.log(line);
  }
};

const logInfo = (...args) => writeStructured('info', args);

export const createTestOrgIfNotExists = (client) => {
  let orgId = 0;

  let res = client.orgs.getByName('k6');
  if (res.status === 404) {
    res = client.orgs.create('k6');
    if (res.status !== 200) {
      throw new Error('Expected 200 response status when creating org');
    }
    return res.json().orgId;
  }

  // This can happen e.g. in Hosted Grafana instances, where even admins
  // cannot see organisations
  if (res.status !== 200) {
    logInfo(`unable to get orgs from instance, continuing with default orgId ${orgId}`);
    return orgId;
  }

  return res.json().id;
};

export const createTestdataDatasourceIfNotExists = (client) => {
  const payload = {
    access: 'proxy',
    isDefault: false,
    name: 'k6-testdata',
    type: 'testdata',
  };

  let res = client.datasources.getByName(payload.name);
  if (res.status === 404) {
    res = client.datasources.create(payload);
  }

  if (res.status !== 200) {
    throw new Error(`expected 200 response status when creating datasource, got ${res.status}`);
  }

  return res.json().id;
};

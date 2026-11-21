// POSTs `data` as JSON to `url`: the reply's JSON, or nothing when the
// request fails or is refused. A refusal (a status of 400 or more) is not
// logged: the form says so on screen, and the browser's own console already
// records the failed request with its status. A request that never got an
// answer (offline, blocked) logs its error.
export async function post(url: string, data: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error(error);
    return undefined;
  }
  if (!res.ok) return undefined;

  return res.json().catch(() => undefined);
}

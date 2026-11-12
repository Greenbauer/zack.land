// POSTs `data` as JSON to `url`: the reply's JSON, or nothing (and the
// error in the console) when the request fails or is refused.
export async function post(url: string, data: unknown): Promise<unknown> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();

    return await res.json();
  } catch (error) {
    console.error(error);
  }
}

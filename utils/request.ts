export async function get(url: string): Promise<any> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();

    return await res.json();
  } catch (error) {
    console.error(error);
  }
}

export async function post(url: string, data: any): Promise<any> {
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

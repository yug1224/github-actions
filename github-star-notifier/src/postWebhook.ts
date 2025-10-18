export default async (text: string, webhookUrl?: string): Promise<void> => {
  if (!webhookUrl) {
    console.log('WEBHOOK_URL is not defined, skipping webhook post');
    return;
  }

  const postObj = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value1: text }),
  };

  console.log(JSON.stringify(postObj, null, 2));
  await fetch(webhookUrl, postObj);
  console.log('Success postWebhook');
};

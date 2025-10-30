// add these methods inside AuthProvider's returned value (or export separately)
  async function createTopUpRequest(amount, method = 'manual', note = '') {
    if (!user) throw new Error('Not authenticated');
    const res = await client.post('/api/topup/request', { amount, method, note });
    return res.data;
  }

  async function getMyTopUpRequests() {
    const res = await client.get('/api/topup/my');
    return res.data;
  }

// and include them in the provider value:
  // ...
  const value = {
    client,
    token,
    user,
    ready,
    register,
    login,
    logout,
    getMe,
    uploadMedia,
    extendAccount,
    createTopUpRequest,
    getMyTopUpRequests,
    setUser
  };
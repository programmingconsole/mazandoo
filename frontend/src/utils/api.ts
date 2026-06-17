import { MockDb } from './mockDb';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

function getMockUser() {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem('mock_current_user');
  return u ? JSON.parse(u) : null;
}

function mockFetch(endpoint: string, options: RequestInit = {}): Response {
  const method = options.method || 'GET';
  const url = new URL(endpoint, 'http://localhost/api');
  const path = url.pathname;
  
  // Extract query parameters manually
  const queryParams: Record<string, string> = {};
  const queryIdx = endpoint.indexOf('?');
  if (queryIdx > -1) {
    const queryStr = endpoint.substring(queryIdx + 1);
    queryStr.split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      queryParams[k] = decodeURIComponent(v || '');
    });
  }

  // 1. Users Register
  if (path.startsWith('/users/register/')) {
    const body = JSON.parse(options.body as string);
    const mockUser = {
      id: 1,
      username: body.username,
      email: body.email,
      first_name: body.first_name || '',
      last_name: body.last_name || '',
      reputation_score: 5,
      level: 'Explorer',
      profile_image: null,
      created_at: new Date().toISOString()
    };
    localStorage.setItem('mock_current_user', JSON.stringify(mockUser));
    localStorage.setItem('access_token', 'mock_access_token');
    localStorage.setItem('refresh_token', 'mock_refresh_token');
    return new Response(JSON.stringify({
      user: mockUser,
      tokens: { access: 'mock_access_token', refresh: 'mock_refresh_token' }
    }), { status: 201 });
  }

  // 2. Users Login
  if (path.startsWith('/users/login/')) {
    const body = JSON.parse(options.body as string);
    const mockUser = {
      id: 1,
      username: body.username,
      email: `${body.username}@example.com`,
      first_name: 'Mock',
      last_name: 'User',
      reputation_score: 25,
      level: 'Explorer',
      profile_image: null,
      created_at: new Date().toISOString()
    };
    localStorage.setItem('mock_current_user', JSON.stringify(mockUser));
    localStorage.setItem('access_token', 'mock_access_token');
    localStorage.setItem('refresh_token', 'mock_refresh_token');
    return new Response(JSON.stringify({
      access: 'mock_access_token',
      refresh: 'mock_refresh_token'
    }), { status: 200 });
  }

  // 3. Users Me
  if (path.startsWith('/users/me/')) {
    const user = getMockUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    
    if (method === 'PATCH' || method === 'PUT') {
      const body = JSON.parse(options.body as string);
      const updatedUser = { ...user, ...body };
      localStorage.setItem('mock_current_user', JSON.stringify(updatedUser));
      return new Response(JSON.stringify(updatedUser), { status: 200 });
    }
    
    return new Response(JSON.stringify(user), { status: 200 });
  }

  // 4. Locations List & Details
  if (path.startsWith('/locations/')) {
    const matchFollow = path.match(/\/locations\/(\d+)\/follow\//);
    if (matchFollow) {
      const id = parseInt(matchFollow[1]);
      const isFollowed = MockDb.followLocation(id);
      return new Response(JSON.stringify({ status: isFollowed ? "followed" : "unfollowed", is_followed: isFollowed }), { status: 200 });
    }

    if (method === 'PATCH' || method === 'PUT') {
      const matchDetail = path.match(/\/locations\/(\d+)\//);
      if (matchDetail) {
        const id = parseInt(matchDetail[1]);
        const body = JSON.parse(options.body as string);
        const locations = MockDb.get('locations', []);
        const idx = locations.findIndex((l: any) => l.id === id);
        if (idx > -1) {
          const updated = { ...locations[idx], ...body };
          locations[idx] = updated;
          MockDb.set('locations', locations);
          return new Response(JSON.stringify(updated), { status: 200 });
        }
      }
    }

    if (method === 'POST') {
      const body = JSON.parse(options.body as string);
      const newLoc = MockDb.addLocation(body);
      return new Response(JSON.stringify(newLoc), { status: 201 });
    }

    if (path.includes('/followed/')) {
      const followedIds = MockDb.get('followed_locations', []);
      const locations = MockDb.getLocations().filter((l: any) => followedIds.includes(l.id));
      return new Response(JSON.stringify(locations), { status: 200 });
    }

    const matchDetail = path.match(/\/locations\/(\d+)\//);
    if (matchDetail) {
      const id = parseInt(matchDetail[1]);
      const locations = MockDb.getLocations();
      const loc = locations.find((l: any) => l.id === id);
      return new Response(JSON.stringify(loc), { status: 200 });
    }

    return new Response(JSON.stringify(MockDb.getLocations()), { status: 200 });
  }

  // 5. Reports ViewSet & Comments
  if (path.startsWith('/reports/reports/')) {
    const matchComments = path.match(/\/reports\/reports\/(\d+)\/comments\//);
    if (matchComments) {
      const reportId = parseInt(matchComments[1]);
      const comments = MockDb.get('comments', []).filter((c: any) => c.report_id === reportId);
      return new Response(JSON.stringify(comments), { status: 200 });
    }
    
    const matchCommentPost = path.match(/\/reports\/reports\/(\d+)\/comment\//);
    if (matchCommentPost) {
      const reportId = parseInt(matchCommentPost[1]);
      const body = JSON.parse(options.body as string);
      const comments = MockDb.get('comments', []);
      const user = getMockUser() || { id: 99, username: "visitor" };
      const newComment = {
        id: Date.now(),
        report_id: reportId,
        user: { id: user.id, username: user.username },
        comment: body.comment,
        created_at: new Date().toISOString()
      };
      comments.push(newComment);
      MockDb.set('comments', comments);
      return new Response(JSON.stringify(newComment), { status: 201 });
    }

    const matchVote = path.match(/\/reports\/reports\/(\d+)\/vote\//);
    if (matchVote) {
      const reportId = parseInt(matchVote[1]);
      const body = JSON.parse(options.body as string);
      const user = getMockUser() || { id: 99, username: "visitor" };
      const report = MockDb.voteReport(reportId, body.vote_type, user.id);
      return new Response(JSON.stringify({ status: "vote_registered", vote_score: report ? report.vote_score : 0 }), { status: 200 });
    }

    if (method === 'POST') {
      const body = options.body as FormData;
      const reportData: any = {};
      body.forEach((value, key) => {
        reportData[key] = value;
      });
      const user = getMockUser() || { id: 1, username: "visitor", reputation_score: 5, level: "Explorer" };
      
      // Handle file converting to data-url mock placeholder if needed
      const file = body.get('image');
      if (file && file instanceof File) {
        reportData['image'] = '/weather-mock.jpg'; // mock fallback preview image path
      }
      
      const report = MockDb.addReport(reportData, user);
      
      // Update local reputation score in mock user
      user.reputation_score += 5;
      if (file) user.reputation_score += 10;
      if (user.reputation_score < 50) user.level = 'Explorer';
      else if (user.reputation_score < 150) user.level = 'Reporter';
      else if (user.reputation_score < 500) user.level = 'Local Guide';
      localStorage.setItem('mock_current_user', JSON.stringify(user));

      return new Response(JSON.stringify({
        message: "Weather report submitted successfully!",
        points_earned: file ? 15 : 5,
        report
      }), { status: 201 });
    }

    const reports = MockDb.get('reports', []);
    const locId = queryParams['location'];
    const uId = queryParams['user'];
    const weatherType = queryParams['weather_type'];
    let filtered = reports;
    if (locId) {
      filtered = filtered.filter((r: any) => r.location.id === parseInt(locId));
    }
    if (uId) {
      filtered = filtered.filter((r: any) => r.user.id === parseInt(uId));
    }
    if (weatherType) {
      filtered = filtered.filter((r: any) => r.weather_type.toLowerCase() === weatherType.toLowerCase());
    }
    return new Response(JSON.stringify(filtered), { status: 200 });
  }

  // 6. Confidence Engine
  if (path.startsWith('/reports/confidence/')) {
    const locId = parseInt(queryParams['location'] || '1');
    const conf = MockDb.getConfidence(locId);
    return new Response(JSON.stringify(conf), { status: 200 });
  }

  // 7. Travel Advisory
  if (path.startsWith('/reports/advisory/')) {
    const locId = parseInt(queryParams['location'] || '1');
    const conf = MockDb.getConfidence(locId);
    const weather = conf.current_weather;
    const score = conf.confidence_score;
    const level = conf.confidence_level;
    
    let advisory_level = "Normal";
    let advisory_message = "No travel advisories. Weather is calm.";
    
    if (weather === "Flooding" || weather === "Storm") {
      advisory_level = "Danger";
      advisory_message = `CRITICAL ADVISORY: Hyperlocal reports confirm ${weather} conditions. Travel is highly discouraged.`;
    }

    return new Response(JSON.stringify({
      location: "Selected Location",
      current_weather: weather,
      confidence_score: score,
      confidence_level: level,
      advisory_level,
      advisory_message,
      report_count: conf.report_count
    }), { status: 200 });
  }

  // 8. Notifications
  if (path.startsWith('/notifications/')) {
    if (path.includes('/mark_all_read/')) {
      const notifications = MockDb.get('notifications', []);
      notifications.forEach((n: any) => n.is_read = true);
      MockDb.set('notifications', notifications);
      return new Response(JSON.stringify({ status: "all notifications marked as read" }), { status: 200 });
    }
    return new Response(JSON.stringify(MockDb.get('notifications', [])), { status: 200 });
  }

  return new Response(JSON.stringify({ error: "Endpoint not matched" }), { status: 404 });
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && typeof window !== 'undefined') {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const refreshResponse = await fetch(`${API_URL}/users/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            localStorage.setItem('access_token', data.access);
            headers.set('Authorization', `Bearer ${data.access}`);
            return await fetch(`${API_URL}${endpoint}`, {
              ...options,
              headers,
            });
          }
        } catch (err) {
          console.error("Token refresh failed", err);
        }
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }

    return response;
  } catch (netError) {
    // If the network call failed (meaning backend is offline), trigger the Mock Database handler!
    console.warn(`Connection to API server failed. Falling back to local Mock Mode for endpoint: ${endpoint}`);
    return mockFetch(endpoint, options);
  }
}

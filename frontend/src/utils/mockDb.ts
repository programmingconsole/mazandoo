// LocalStorage-based Mock Database for offline development

export interface MockUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  reputation_score: number;
  level: string;
  profile_image: string | null;
  created_at: string;
}

export interface MockLocation {
  id: number;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  is_followed?: boolean;
  followers_count?: number;
}

export interface MockReport {
  id: number;
  user: Partial<MockUser>;
  location: Partial<MockLocation>;
  weather_type: string;
  description: string;
  temperature: number;
  visibility: string;
  wind_condition: string;
  image: string | null;
  is_verified: boolean;
  vote_score: number;
  user_vote: string | null;
  comments_count: number;
  created_at: string;
}

export interface MockComment {
  id: number;
  report_id: number;
  user: Partial<MockUser>;
  comment: string;
  created_at: string;
}

export interface MockNotification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Initial Seeds
const SEED_LOCATIONS: MockLocation[] = [
  { id: 1, city: "Cape Town", state: "Western Cape", country: "South Africa", latitude: -33.9249, longitude: 18.4241 },
  { id: 2, city: "Nairobi", state: "Nairobi County", country: "Kenya", latitude: -1.2921, longitude: 36.8219 },
  { id: 3, city: "Tokyo", state: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
  { id: 4, city: "Chamonix", state: "Haute-Savoie", country: "France", latitude: 45.9227, longitude: 6.8685 },
  { id: 5, city: "Grand Canyon", state: "Arizona", country: "USA", latitude: 36.0544, longitude: -112.1401 }
];

const SEED_REPORTS: MockReport[] = [
  {
    id: 101,
    user: { id: 2, username: "trailblazer", reputation_score: 120, level: "Reporter" },
    location: { id: 1, city: "Cape Town", country: "South Africa" },
    weather_type: "Sunny",
    description: "Clear skies at Table Mountain. Perfect visibility for hiking today.",
    temperature: 22,
    visibility: "Good",
    wind_condition: "Light",
    image: null,
    is_verified: true,
    vote_score: 5,
    user_vote: null,
    comments_count: 0,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 102,
    user: { id: 3, username: "safariguide", reputation_score: 380, level: "Local Guide" },
    location: { id: 2, city: "Nairobi", country: "Kenya" },
    weather_type: "Cloudy",
    description: "Overcast morning, but roads are dry. Traffic moving fine on Uhuru Highway.",
    temperature: 19,
    visibility: "Good",
    wind_condition: "Calm",
    image: null,
    is_verified: false,
    vote_score: 3,
    user_vote: null,
    comments_count: 0,
    created_at: new Date(Date.now() - 7200000).toISOString()
  }
];

export class MockDb {
  static get(key: string, defaultVal: any) {
    if (typeof window === 'undefined') return defaultVal;
    const item = localStorage.getItem(`mock_${key}`);
    return item ? JSON.parse(item) : defaultVal;
  }

  static set(key: string, val: any) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`mock_${key}`, JSON.stringify(val));
  }

  static init() {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('mock_initialized')) {
      this.set('locations', SEED_LOCATIONS);
      this.set('reports', SEED_REPORTS);
      this.set('comments', []);
      this.set('notifications', [
        {
          id: 1,
          title: "HEAT WARNING",
          message: "High temperature alert issued for Grand Canyon region today.",
          is_read: false,
          created_at: new Date().toISOString()
        }
      ]);
      this.set('followed_locations', []);
      localStorage.setItem('mock_initialized', 'true');
    }
  }

  static getLocations() {
    this.init();
    const followed = this.get('followed_locations', []);
    const locations = this.get('locations', SEED_LOCATIONS);
    return locations.map((loc: MockLocation) => ({
      ...loc,
      is_followed: followed.includes(loc.id),
      followers_count: followed.includes(loc.id) ? 1 : 0
    }));
  }

  static followLocation(id: number) {
    const followed: number[] = this.get('followed_locations', []);
    const idx = followed.indexOf(id);
    let isFollowed = false;
    if (idx > -1) {
      followed.splice(idx, 1);
    } else {
      followed.push(id);
      isFollowed = true;
    }
    this.set('followed_locations', followed);
    return isFollowed;
  }

  static addReport(reportData: any, currentUser: any) {
    const reports = this.get('reports', SEED_REPORTS);
    const locations = this.getLocations();
    const loc = locations.find((l: any) => l.id === parseInt(reportData.location));
    
    const newReport: MockReport = {
      id: Date.now(),
      user: {
        id: currentUser.id,
        username: currentUser.username,
        reputation_score: currentUser.reputation_score,
        level: currentUser.level
      },
      location: {
        id: loc.id,
        city: loc.city,
        country: loc.country
      },
      weather_type: reportData.weather_type,
      description: reportData.description || '',
      temperature: parseFloat(reportData.temperature),
      visibility: reportData.visibility,
      wind_condition: reportData.wind_condition,
      image: reportData.image || null, // in mockup, handles data-url or empty
      is_verified: false,
      vote_score: 0,
      user_vote: null,
      comments_count: 0,
      created_at: new Date().toISOString()
    };
    
    reports.unshift(newReport);
    this.set('reports', reports);
    return newReport;
  }

  static voteReport(reportId: number, voteType: 'UP' | 'DOWN', userId: number) {
    const reports = this.get('reports', SEED_REPORTS);
    const report = reports.find((r: any) => r.id === reportId);
    if (!report) return null;

    if (voteType === 'UP') {
      report.vote_score += 1;
      report.user_vote = 'UP';
    } else {
      report.vote_score -= 1;
      report.user_vote = 'DOWN';
    }
    this.set('reports', reports);
    return report;
  }

  static getConfidence(locationId: number) {
    const reports = this.get('reports', SEED_REPORTS).filter((r: any) => r.location.id === locationId);
    if (reports.length === 0) {
      return {
        current_weather: "Sunny",
        confidence_score: 100,
        confidence_level: "High",
        distribution: { "Sunny": 100 },
        report_count: 1
      };
    }
    
    const counts: Record<string, number> = {};
    reports.forEach((r: any) => {
      counts[r.weather_type] = (counts[r.weather_type] || 0) + 1;
    });

    const primaryWeather = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    const score = Math.round((counts[primaryWeather] / reports.length) * 100);
    
    const dist: Record<string, number> = {};
    Object.entries(counts).forEach(([w, c]) => {
      dist[w] = Math.round((c / reports.length) * 100);
    });

    return {
      current_weather: primaryWeather,
      confidence_score: score,
      confidence_level: reports.length > 2 ? "High" : "Medium",
      distribution: dist,
      report_count: reports.length
    };
  }

  static addLocation(locData: any) {
    const locations = this.get('locations', SEED_LOCATIONS);
    const newLoc: MockLocation = {
      id: Date.now(),
      city: locData.city,
      state: locData.state || null,
      country: locData.country,
      latitude: parseFloat(locData.latitude),
      longitude: parseFloat(locData.longitude)
    };
    locations.push(newLoc);
    this.set('locations', locations);
    return newLoc;
  }
}

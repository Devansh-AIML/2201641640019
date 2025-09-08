import React, { useState, useEffect } from 'react';
import './App.css';
import {
  Container, Typography, TextField, Button, Grid, Box, Paper, Card, CardContent,
  IconButton, InputAdornment, Alert, CircularProgress, Link as MuiLink
} from '@mui/material';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  useNavigate
} from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import TimerIcon from '@mui/icons-material/Timer';
import CodeIcon from '@mui/icons-material/Code';

const logger = {
  log: (message) => console.log(message),
  error: (message) => console.error(message),
};

const DEFAULT_VALIDITY = 30;
const STORAGE_KEY = 'shortenedUrls';

const getStoredUrls = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};
const setStoredUrls = (urls) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
};

function RedirectShortUrl({ shortenedUrls }) {
  const { shortcode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const found = shortenedUrls.find(item => item.shortcode === shortcode);
    if (found) {
     
      const updatedUrls = shortenedUrls.map(url =>
        url.shortcode === shortcode
          ? { ...url, clicks: (url.clicks || 0) + 1 }
          : url
      );
      setStoredUrls(updatedUrls);
      window.location.href = found.originalUrl;
    } else {
      setTimeout(() => navigate('/'), 3000); 
    }
  }, [shortcode, shortenedUrls, navigate]);

  const urlExists = shortenedUrls.some(item => item.shortcode === shortcode);

  return (
    <Container sx={{ textAlign: 'center', mt: 10 }}>
      {urlExists ? (
        <>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Redirecting...
          </Typography>
        </>
      ) : (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" color="error">
            Short URL not found
          </Typography>
          <Typography sx={{ mt: 1 }}>
            Redirecting you to the homepage.
          </Typography>
        </Paper>
      )}
    </Container>
  );
}

function MainApp() {
  const [inputs, setInputs] = useState(
    Array(5).fill({ url: '', validity: '', shortcode: '' })
  );
  const [shortenedUrls, setShortenedUrls] = useState(getStoredUrls());
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const isShortcodeUnique = (code, currentIdx = -1) =>
    !shortenedUrls.some(item => item.shortcode === code) &&
    !inputs.some((input, idx) => idx !== currentIdx && input.shortcode === code);

  const handleInputChange = (index, field, value) => {
    const newInputs = [...inputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setInputs(newInputs);
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidShortcode = (code) => /^[a-zA-Z0-9]{3,10}$/.test(code);

  const validateInputs = () => {
    const newErrors = {};
    inputs.forEach((input, idx) => {
      if (input.url) {
        if (!isValidUrl(input.url)) {
          newErrors[`url${idx}`] = 'Invalid URL';
        }
        if (input.validity && (!/^\d+$/.test(input.validity) || parseInt(input.validity) <= 0)) {
          newErrors[`validity${idx}`] = 'Must be a positive number';
        }
        if (input.shortcode) {
          if (!isValidShortcode(input.shortcode)) {
            newErrors[`shortcode${idx}`] = '3-10 alphanumeric chars';
          } else if (!isShortcodeUnique(input.shortcode, idx)) {
            newErrors[`shortcode${idx}`] = 'This code is already taken';
          }
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateShortCode = () => {
    let code;
    do {
      code = Math.random().toString(36).substring(2, 8);
    } while (!isShortcodeUnique(code));
    return code;
  };

  const handleShorten = () => {
    if (!validateInputs()) {
      logger.error('Validation failed');
      setSuccessMessage('');
      return;
    }

    const now = new Date();
    const newShortened = inputs
      .filter(input => input.url)
      .map(input => {
        const shortcode = input.shortcode || generateShortCode();
        const validity = input.validity ? parseInt(input.validity) : DEFAULT_VALIDITY;
        const expiry = new Date(now.getTime() + validity * 60000);
        return {
          originalUrl: input.url,
          shortcode,
          shortUrl: `${window.location.origin}/${shortcode}`,
          createdAt: now.toISOString(),
          expiresAt: expiry.toISOString(),
          clicks: 0,
        };
      });

    if (newShortened.length > 0) {
        const updatedUrls = [...shortenedUrls, ...newShortened];
        setShortenedUrls(updatedUrls);
        setStoredUrls(updatedUrls);
        logger.log(`Shortened URLs: ${newShortened.map(u => u.shortUrl).join(', ')}`);
        setInputs(Array(5).fill({ url: '', validity: '', shortcode: '' }));
        setErrors({});
        setSuccessMessage(`${newShortened.length} URL(s) successfully shortened!`);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
          URL Shortener
        </Typography>
        <Box component="form" noValidate autoComplete="off">
          <Grid container spacing={2} alignItems="center">
            {inputs.map((input, idx) => (
              <React.Fragment key={idx}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={`URL ${idx + 1}`}
                    value={input.url}
                    onChange={e => handleInputChange(idx, 'url', e.target.value)}
                    error={!!errors[`url${idx}`]}
                    helperText={errors[`url${idx}`]}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="Validity (min)"
                    value={input.validity}
                    onChange={e => handleInputChange(idx, 'validity', e.target.value)}
                    error={!!errors[`validity${idx}`]}
                    helperText={errors[`validity${idx}`] || 'Default: 30'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TimerIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="Custom Code"
                    value={input.shortcode}
                    onChange={e => handleInputChange(idx, 'shortcode', e.target.value)}
                    error={!!errors[`shortcode${idx}`]}
                    helperText={errors[`shortcode${idx}`] || 'Optional'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CodeIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
          <Button
            variant="contained"
            color="primary"
            onClick={handleShorten}
            sx={{ mt: 3, display: 'block', mx: 'auto' }}
            size="large"
          >
            Shorten URLs
          </Button>
        </Box>
      </Paper>

      {successMessage && <Alert severity="success" sx={{ mb: 4 }}>{successMessage}</Alert>}

      {shortenedUrls.length > 0 && (
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Your Links
          </Typography>
          {shortenedUrls.map((item, idx) => (
            <Card key={idx} sx={{ mb: 2 }} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="h6" component="div">
                          <MuiLink href={item.shortUrl} target="_blank" rel="noopener">
                            {item.shortUrl.replace(/^https?:\/\//, '')}
                          </MuiLink>
                        </Typography>
                        <Typography color="text.secondary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                           Original: {item.originalUrl}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                           Expires: {new Date(item.expiresAt).toLocaleString()} | Clicks: {item.clicks || 0}
                        </Typography>
                    </Box>
                    <IconButton onClick={() => navigator.clipboard.writeText(item.shortUrl)} aria-label="copy">
                        <ContentCopyIcon />
                    </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}

export default function App() {
  const [shortenedUrls, setShortenedUrls] = useState(getStoredUrls());

  useEffect(() => {
    const onStorage = () => setShortenedUrls(getStoredUrls());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/:shortcode" element={<RedirectShortUrl shortenedUrls={shortenedUrls} />} />
      </Routes>
    </Router>
  );
}
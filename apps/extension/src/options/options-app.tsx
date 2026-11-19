import { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  CssBaseline,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  DEFAULT_SETTINGS,
  Settings,
  loadSettings,
  saveSettings,
} from '../shared/settings';

export const OptionsApp = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await saveSettings(settings);
      setSaved(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <CssBaseline />
      <Container maxWidth={'sm'} sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant={'h5'} gutterBottom>
            Media File Detector Settings
          </Typography>
          <Typography color={'text.secondary'} mb={3}>
            Defaults applied every time the popup opens. You can still change
            them in the popup for a single download.
          </Typography>

          <Stack spacing={3}>
            <Box>
              <Typography variant={'subtitle1'} fontWeight={600}>
                Filtering
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={settings.requireResolution}
                      onChange={(event) =>
                        update({ requireResolution: event.target.checked })
                      }
                    />
                  }
                  label={'Require resolution (hide images with unknown size)'}
                />
              </FormGroup>
              <TextField
                variant={'filled'}
                size={'small'}
                type={'number'}
                label={'Min width and height'}
                value={settings.minWidthAndHeight}
                onChange={(event) =>
                  update({
                    minWidthAndHeight: Math.max(0, Number(event.target.value) || 0),
                  })
                }
                sx={{ mt: 1 }}
              />
            </Box>

            <Box>
              <Typography variant={'subtitle1'} fontWeight={600}>
                Downloads
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={settings.useTitleNaming}
                      onChange={(event) =>
                        update({ useTitleNaming: event.target.checked })
                      }
                    />
                  }
                  label={
                    'Name files by page title ("<title> 01.jpg") instead of generated ids'
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={settings.zipInFolder}
                      onChange={(event) =>
                        update({ zipInFolder: event.target.checked })
                      }
                    />
                  }
                  label={'Put files in a folder inside the zip (unchecked: flat)'}
                />
              </FormGroup>
            </Box>

            <Box display={'flex'} alignItems={'center'} gap={2}>
              <Button
                variant={'contained'}
                onClick={handleSave}
                disabled={!loaded}
              >
                Save
              </Button>
              {saved && <Alert severity={'success'}>Settings saved</Alert>}
            </Box>
          </Stack>
        </Paper>
      </Container>
    </>
  );
};

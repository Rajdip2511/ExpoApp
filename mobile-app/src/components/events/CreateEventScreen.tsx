import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Appbar, 
  Card, 
  Title, 
  Button, 
  Text, 
  TextInput,
  ActivityIndicator,
  HelperText,
  Switch
} from 'react-native-paper';
import { useMutation } from '@apollo/client';
import { CREATE_EVENT } from '../../graphql/queries';
import { useAuthStore } from '../../stores/authStore';

interface CreateEventScreenProps {
  onGoBack: () => void;
  onEventCreated: () => void;
}

interface CreateEventInput {
  name: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
}

export const CreateEventScreen: React.FC<CreateEventScreenProps> = ({ 
  onGoBack, 
  onEventCreated 
}) => {
  const [formData, setFormData] = useState<CreateEventInput>({
    name: '',
    description: '',
    location: '',
    startTime: '',
    endTime: ''
  });
  
  const [errors, setErrors] = useState<Partial<CreateEventInput>>({});
  const [hasEndTime, setHasEndTime] = useState(false);
  const { user } = useAuthStore();

  const [createEventMutation, { loading }] = useMutation(CREATE_EVENT, {
    onCompleted: (data) => {
      Alert.alert(
        'Success!', 
        `Event "${data.createEvent.name}" created successfully!`,
        [{ text: 'OK', onPress: onEventCreated }]
      );
    },
    onError: (error) => {
      Alert.alert('Error', `Failed to create event: ${error.message}`);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateEventInput> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.startTime.trim()) {
      newErrors.startTime = 'Start time is required';
    } else {
      const startDate = new Date(formData.startTime);
      if (isNaN(startDate.getTime())) {
        newErrors.startTime = 'Invalid date format (use YYYY-MM-DD HH:MM)';
      } else if (startDate < new Date()) {
        newErrors.startTime = 'Start time cannot be in the past';
      }
    }

    if (hasEndTime && formData.endTime.trim()) {
      const endDate = new Date(formData.endTime);
      const startDate = new Date(formData.startTime);
      
      if (isNaN(endDate.getTime())) {
        newErrors.endTime = 'Invalid date format (use YYYY-MM-DD HH:MM)';
      } else if (endDate <= startDate) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await createEventMutation({
        variables: {
          input: {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            location: formData.location.trim(),
            startTime: new Date(formData.startTime).toISOString(),
            endTime: hasEndTime && formData.endTime.trim() 
              ? new Date(formData.endTime).toISOString() 
              : null
          }
        }
      });
    } catch (error) {
      // Error handled by onError callback
    }
  };

  const updateFormData = (field: keyof CreateEventInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getDateTimeHint = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);
    
    return `Format: YYYY-MM-DD HH:MM (e.g., ${tomorrow.toISOString().slice(0, 16).replace('T', ' ')})`;
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={onGoBack} />
        <Appbar.Content title="Create New Event" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.formCard}>
          <Card.Content>
            <Title style={styles.formTitle}>Event Details</Title>
            
            <TextInput
              label="Event Name *"
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              mode="outlined"
              style={styles.input}
              error={!!errors.name}
              disabled={loading}
              placeholder="e.g., React Native Meetup"
            />
            <HelperText type="error" visible={!!errors.name}>
              {errors.name}
            </HelperText>

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              disabled={loading}
              placeholder="Tell people what your event is about..."
            />

            <TextInput
              label="Location *"
              value={formData.location}
              onChangeText={(text) => updateFormData('location', text)}
              mode="outlined"
              style={styles.input}
              error={!!errors.location}
              disabled={loading}
              placeholder="e.g., Tech Hub Downtown, Virtual (Zoom), etc."
            />
            <HelperText type="error" visible={!!errors.location}>
              {errors.location}
            </HelperText>

            <TextInput
              label="Start Date & Time *"
              value={formData.startTime}
              onChangeText={(text) => updateFormData('startTime', text)}
              mode="outlined"
              style={styles.input}
              error={!!errors.startTime}
              disabled={loading}
              placeholder="YYYY-MM-DD HH:MM"
            />
            <HelperText type="error" visible={!!errors.startTime}>
              {errors.startTime}
            </HelperText>
            <HelperText type="info" visible={!errors.startTime}>
              {getDateTimeHint()}
            </HelperText>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Set End Time</Text>
              <Switch 
                value={hasEndTime} 
                onValueChange={setHasEndTime}
                disabled={loading}
              />
            </View>

            {hasEndTime && (
              <>
                <TextInput
                  label="End Date & Time"
                  value={formData.endTime}
                  onChangeText={(text) => updateFormData('endTime', text)}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.endTime}
                  disabled={loading}
                  placeholder="YYYY-MM-DD HH:MM"
                />
                <HelperText type="error" visible={!!errors.endTime}>
                  {errors.endTime}
                </HelperText>
              </>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={onGoBack}
                style={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.createButton}
                disabled={loading}
                loading={loading}
              >
                {loading ? 'Creating...' : 'Create Event'}
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.previewCard}>
          <Card.Content>
            <Title style={styles.previewTitle}>Preview</Title>
            <Text style={styles.previewText}>
              <Text style={styles.previewLabel}>Name: </Text>
              {formData.name || 'Enter event name'}
            </Text>
            <Text style={styles.previewText}>
              <Text style={styles.previewLabel}>Location: </Text>
              {formData.location || 'Enter location'}
            </Text>
            <Text style={styles.previewText}>
              <Text style={styles.previewLabel}>Start: </Text>
              {formData.startTime || 'Enter start time'}
            </Text>
            {hasEndTime && (
              <Text style={styles.previewText}>
                <Text style={styles.previewLabel}>End: </Text>
                {formData.endTime || 'Enter end time'}
              </Text>
            )}
            <Text style={styles.previewText}>
              <Text style={styles.previewLabel}>Creator: </Text>
              {user?.name || 'Unknown'}
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    marginBottom: 16,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 0.45,
  },
  createButton: {
    flex: 0.45,
  },
  previewCard: {
    elevation: 4,
  },
  previewTitle: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  previewText: {
    fontSize: 14,
    marginBottom: 8,
  },
  previewLabel: {
    fontWeight: 'bold',
  },
}); 
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { removeItem } from '../utils/storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import client from '../api/client';

type Task = {
  id: number;
  category: string;
  name: string;
  description: string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'TaskSelection'>;

export default function TaskSelectionScreen({ navigation }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.get('/tasks');
      setTasks(response.data);
    } catch (err: any) {
      setError('Failed to load tasks. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskSelection = (id: number) => {
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(selectedTaskIds.filter(taskId => taskId !== id));
    } else {
      setSelectedTaskIds([...selectedTaskIds, id]);
    }
  };

  const handleConfirmTasks = async () => {
    if (selectedTaskIds.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one task to continue.');
      return;
    }

    setIsSaving(true);
    try {
      await client.post('/user-tasks', { taskIds: selectedTaskIds });
      navigation.replace('Home');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save selected tasks. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTasks = tasks.filter(task => 
    task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6B8E7B" />
        <Text style={styles.loadingText}>Loading task catalogue...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTasks}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ marginTop: 24 }} 
          onPress={async () => {
            await removeItem('userToken');
            navigation.replace('Login');
          }}
        >
          <Text style={{ color: '#DC2626', fontWeight: '600', fontSize: 14 }}>Log Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Select Your Tasks</Text>
        <Text style={styles.subtitle}>Choose the services you need assistance with.</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks or categories..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isSelected = selectedTaskIds.includes(item.id);
            return (
              <TouchableOpacity 
                style={[styles.taskCard, isSelected && styles.taskCardSelected]}
                onPress={() => toggleTaskSelection(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.taskInfo}>
                  <Text style={styles.categoryBadge}>{item.category}</Text>
                  <Text style={styles.taskName}>{item.name}</Text>
                  <Text style={styles.taskDesc}>{item.description}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity 
          style={[styles.confirmButton, (isSaving || selectedTaskIds.length === 0) && styles.buttonDisabled]} 
          onPress={handleConfirmTasks}
          disabled={isSaving || selectedTaskIds.length === 0}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>
              Confirm Selection ({selectedTaskIds.length})
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6B8E7B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 80,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskCardSelected: {
    borderColor: '#6B8E7B',
    backgroundColor: '#F0FDF4',
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B8E7B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  taskName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  taskDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#6B8E7B',
    borderColor: '#6B8E7B',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: '#6B8E7B',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { authService } from '../../services/authService';

jest.mock('../../services/authService', () => ({
  authService: { signIn: jest.fn() },
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('warns instead of calling signIn when email or password is missing', () => {
    const { getByText } = render(<LoginScreen onLogin={jest.fn()} onSignUp={jest.fn()} onForgotPassword={jest.fn()} />);

    fireEvent.press(getByText('Sign In'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter email and password');
    expect(authService.signIn).not.toHaveBeenCalled();
  });

  it('signs in and calls onLogin when credentials are provided', async () => {
    authService.signIn.mockResolvedValue({ user: { id: 'user-1' } });
    const onLogin = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen onLogin={onLogin} onSignUp={jest.fn()} onForgotPassword={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Email address'), 'student@compuclass.test');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
    expect(authService.signIn).toHaveBeenCalledWith('student@compuclass.test', 'password123');
  });

  it('shows the Supabase error message and does not call onLogin on failure', async () => {
    authService.signIn.mockRejectedValue(new Error('Invalid login credentials'));
    const onLogin = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen onLogin={onLogin} onSignUp={jest.fn()} onForgotPassword={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Email address'), 'student@compuclass.test');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid login credentials')
    );
    expect(onLogin).not.toHaveBeenCalled();
  });
});

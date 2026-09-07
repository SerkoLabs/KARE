import { render, screen } from '@testing-library/react-native';

import FoundationScreen from '@/app/index';

describe('<FoundationScreen />', () => {
  test('renders the KARE foundation shell without pretending product data exists', async () => {
    await render(<FoundationScreen />);

    expect(screen.getByRole('header', { name: 'KARE' })).toBeTruthy();
    expect(
      screen.getByText('Filmlerini biriktir. Sinemayı keşfet.'),
    ).toBeTruthy();
  });
});

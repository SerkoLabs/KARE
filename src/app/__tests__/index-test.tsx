import { render } from '@testing-library/react-native';
import DiscoverScreen from '@/app/(tabs)/index';

describe('<DiscoverScreen />', () => {
  test('makes the decision promise primary', async () => {
    const view = await render(<DiscoverScreen />);

    expect(
      view.getByRole('header', {
        name: 'Bu gece ne izleyeceğini düşünme.',
      }),
    ).toBeTruthy();
    expect(view.getByText('NE İZLESEM?')).toBeTruthy();
  });
});

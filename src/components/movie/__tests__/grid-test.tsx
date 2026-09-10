import { render } from '@testing-library/react-native';
import { MoviePosterGrid } from '@/components/movie/MoviePosterGrid';

describe('<MoviePosterGrid />', () => {
  test('renders truthful empty state', async () => {
    const view = await render(
      <MoviePosterGrid
        emptyTitle="Kütüphanen henüz boş"
        emptyMessage="İlk filmini ekle."
        items={[]}
      />,
    );

    expect(view.getByText('Kütüphanen henüz boş')).toBeTruthy();
    expect(view.getByText('İlk filmini ekle.')).toBeTruthy();
  });

  test('renders supplied metadata without invention', async () => {
    const view = await render(
      <MoviePosterGrid
        emptyTitle="Boş"
        items={[{ id: '1', title: 'Persona', year: 1966, rating: 4.5 }]}
      />,
    );

    expect(view.getByText('Persona')).toBeTruthy();
    expect(view.getByText('1966')).toBeTruthy();
    expect(view.getByText('★ 4.5')).toBeTruthy();
  });
});

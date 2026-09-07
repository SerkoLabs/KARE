import { render, screen } from '@testing-library/react-native';

import { MoviePosterGrid } from '@/components/movie/MoviePosterGrid';

describe('<MoviePosterGrid />', () => {
  test('renders a truthful empty state when no movies exist', () => {
    render(
      <MoviePosterGrid
        emptyTitle="Kütüphanen henüz boş"
        emptyMessage="İlk filmini ekle."
        items={[]}
      />,
    );

    expect(screen.getByText('Kütüphanen henüz boş')).toBeTruthy();
    expect(screen.getByText('İlk filmini ekle.')).toBeTruthy();
  });

  test('renders real supplied movie metadata without inventing values', () => {
    render(
      <MoviePosterGrid
        emptyTitle="Boş"
        items={[{ id: '1', title: 'Persona', year: 1966, rating: 4.5 }]}
      />,
    );

    expect(screen.getByText('Persona')).toBeTruthy();
    expect(screen.getByText('1966')).toBeTruthy();
    expect(screen.getByText('★ 4.5')).toBeTruthy();
  });
});

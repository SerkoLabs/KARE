import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { PosterSurface } from '@/components/ui/PosterSurface';
import { spacing } from '@/design/tokens';
export type MoviePosterItem={id:string;title:string;year?:number;posterUri?:string|null;rating?:number|null};type Props={movie:MoviePosterItem;onPress?:((movieId:string)=>void)|undefined};
export function MoviePosterCard({movie,onPress}:Props){return <Pressable accessibilityLabel={`${movie.title}${movie.year?`, ${movie.year}`:''}`} accessibilityRole={onPress?'button':undefined} disabled={!onPress} onPress={()=>onPress?.(movie.id)} style={({pressed})=>[styles.container,pressed&&styles.pressed]}><PosterSurface title={movie.title} uri={movie.posterUri??null}/><View style={styles.meta}><AppText numberOfLines={1} variant="label">{movie.title}</AppText><View style={styles.metaRow}>{movie.year?<AppText tone="secondary" variant="caption">{movie.year}</AppText>:null}{typeof movie.rating==='number'?<AppText tone="rating" variant="caption">★ {movie.rating.toFixed(1)}</AppText>:null}</View></View></Pressable>}
const styles=StyleSheet.create({container:{gap:spacing.xs},pressed:{opacity:.72},meta:{gap:spacing.xxs},metaRow:{flexDirection:'row',justifyContent:'space-between',gap:spacing.xs}});

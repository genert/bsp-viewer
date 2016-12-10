textures/pilsner/sur_036
{
	q3map_nonplanar
	q3map_shadeangle 90
	implicitMap -
}

textures/pilsner/sur_074
{
	q3map_nonplanar
	q3map_shadeangle 75
	implicitMap -
}

textures/pilsner/wall_grass1
{
	q3map_nonplanar
	q3map_shadeangle 30
	implicitMap -
}

textures/pilsner/floor_grass1
{
	implicitMap -
	surfaceparm grasssteps
	surfaceparm landmine
}

textures/pilsner/floor_grass1_surface
{
	implicitMap -
	surfaceparm grasssteps
	surfaceparm landmine
	
	{
		map textures/pilsner/floor_grass1.jpg
		rgbGen identityLighting
	}
	
	{
		map $lightmap
		blendFunc GL_DST_COLOR GL_ZERO
		rgbGen identity
	}
}
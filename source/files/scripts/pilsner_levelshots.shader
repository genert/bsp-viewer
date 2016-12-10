levelshots/pilsner_cc_automap
{
	nopicmip
	nocompress
	nomipmaps
	{
		clampmap levelshots/pilsner_cc.tga
		depthFunc equal
		rgbGen identity
	}
}

levelshots/pilsner_cc_trans
{
	nopicmip
	nocompress
	nomipmaps
	{
		clampmap levelshots/pilsner_cc.tga
		blendfunc blend
		rgbGen identity
		alphaGen vertex
	}
}

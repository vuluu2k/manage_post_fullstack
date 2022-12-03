// import { Context } from '../types/Context'
import {  Query, Resolver } from 'type-graphql'

@Resolver()
export class HelloResolver {
	@Query(_returns => String)
	hello() {
		return 'hello world'
	}
}